"""Synthetic signals only. Demucs and plugin loading are mocked, never downloaded."""
import asyncio
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
from unittest.mock import Mock

import numpy as np
import pytest
import soundfile as sf

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location('pixie_audio', HERE / 'pixie_audio_mcp.py')
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)


@pytest.fixture
def project(tmp_path, monkeypatch):
    monkeypatch.setattr(audio, 'ROOT', tmp_path / 'PIXIE')
    audio.new_project('Test Project')
    return audio.ROOT / 'Test-Project'


def tone(path, amplitude=0.2, channels=2, frequency=1000, seconds=1):
    sr = 48000
    wave = amplitude * np.sin(2 * np.pi * frequency * np.arange(int(sr * seconds)) / sr)
    data = wave if channels == 1 else np.column_stack([wave] * channels)
    sf.write(path, data, sr, subtype='FLOAT')
    return path


def imported(project, tmp_path, **kwargs):
    path = tone(tmp_path / 'synthetic.wav', **kwargs)
    audio.import_audio(project.name, str(path))
    return '00_source/synthetic.wav'


def history(project):
    return json.loads((project / 'session.json').read_text())['history']


def test_creation(project):
    assert all((project / name).is_dir() for name in audio.SUBDIRS)
    assert history(project)[0]['action'] == 'new_project'
    with pytest.raises(ValueError):
        audio.new_project('Test Project')
    with pytest.raises(ValueError):
        audio.new_project('_server')


def test_import_readonly_and_no_replace(project, tmp_path):
    rel = imported(project, tmp_path)
    dest = project / rel
    saved = dest.read_bytes()
    assert not dest.stat().st_mode & (stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH)
    with pytest.raises(ValueError):
        audio.import_audio(project.name, str(tmp_path / 'synthetic.wav'))
    assert saved == dest.read_bytes()
    assert history(project)[-1]['status'] == 'failed'


@pytest.mark.parametrize('channels', [1, 2])
def test_analysis(project, tmp_path, channels):
    rel = imported(project, tmp_path, channels=channels)
    result = audio.analyze(project.name, rel)
    json.dumps(result, allow_nan=False)
    assert result['integrated_lufs'] is not None
    assert result['sample_peak_dbfs'] == pytest.approx(-13.98, abs=0.03)
    assert result['rms_dbfs'] == pytest.approx(-16.99, abs=0.03)
    assert result['crest_factor_db'] == pytest.approx(3.01, abs=0.03)
    assert result['band_energy_percent']['mid'] > 98
    if channels == 2:
        assert result['stereo_correlation'] == pytest.approx(1)


@pytest.mark.parametrize('seconds', [0.001, 1])
def test_silence_json_safe(project, tmp_path, seconds):
    rel = imported(project, tmp_path, amplitude=0, seconds=seconds)
    result = audio.analyze(project.name, rel)
    json.dumps(result, allow_nan=False)
    assert result['integrated_lufs'] is None
    assert result['sample_peak_dbfs'] is None
    assert result['stereo_correlation'] is None


def test_opposite_phase_energy_and_dc(project, tmp_path):
    sr = 48000
    wave = .2 * np.sin(2 * np.pi * 1000 * np.arange(sr) / sr)
    sf.write(tmp_path / 'phase.wav', np.column_stack([wave + .02, -wave - .02]), sr, subtype='FLOAT')
    audio.import_audio(project.name, str(tmp_path / 'phase.wav'))
    result = audio.analyze(project.name, '00_source/phase.wav')
    assert result['stereo_correlation'] < -.99
    assert result['band_energy_percent']['mid'] > 95
    assert result['dc_offset_per_channel'] == pytest.approx([.02, -.02])
    assert any('DC offset' in flag for flag in result['flags'])


def test_versioning_and_master(project, tmp_path):
    rel = imported(project, tmp_path)
    saved = (project / rel).read_bytes()
    chain = [{'type': 'gain', 'gain_db': -6}]
    first = audio.apply_chain(project.name, rel, chain)
    second = audio.apply_chain(project.name, first['output'], chain)
    assert first['output'] == '02_processed/synthetic_v001.wav'
    assert second['output'] == '02_processed/synthetic_v002.wav'
    assert first['after']['sample_peak_dbfs'] == pytest.approx(first['before']['sample_peak_dbfs'] - 6, abs=.03)
    assert sf.info(project / first['output']).subtype == 'FLOAT'
    master = audio.apply_chain(project.name, rel, chain, output_dir='04_masters')
    assert sf.info(project / master['output']).subtype == 'PCM_24'
    assert saved == (project / rel).read_bytes()
    assert len(history(project)) == 5


def test_master_clip_guard(project, tmp_path):
    rel = imported(project, tmp_path, amplitude=.8)
    with pytest.raises(ValueError, match='Master would clip'):
        audio.apply_chain(project.name, rel, [{'type': 'gain', 'gain_db': 12}], output_dir='04_masters')
    assert list((project / '04_masters').iterdir()) == []
    assert history(project)[-1]['status'] == 'failed'


def test_intersample_master_guard(project, tmp_path):
    # Sample values remain below 1, but reconstructed peaks exceed 1.
    sr = 48000
    assert audio._true_peak(np.array([[.9], [.9], [-.9], [-.9]] * 100), sr) > 1
    sf.write(tmp_path / 'overs.wav', np.array([[.9], [.9], [-.9], [-.9]] * 12000), sr, subtype='FLOAT')
    audio.import_audio(project.name, str(tmp_path / 'overs.wav'))
    with pytest.raises(ValueError, match='Master would clip'):
        audio.apply_chain(project.name, '00_source/overs.wav', [{'type': 'gain', 'gain_db': 0}], output_dir='04_masters')


@pytest.mark.parametrize('bad', ['../x.wav', '/etc/hosts'])
def test_path_escape(project, bad):
    with pytest.raises(ValueError):
        audio.analyze(project.name, bad)
    with pytest.raises(ValueError):
        audio.apply_chain(project.name, bad, [{'type': 'gain'}])
    with pytest.raises(ValueError):
        audio.separate_stems(project.name, bad)


def test_absolute_inside_also_rejected(project, tmp_path):
    rel = imported(project, tmp_path)
    with pytest.raises(ValueError):
        audio.analyze(project.name, str(project / rel))


@pytest.mark.parametrize('folder', ['00_source', '01_stems', '02_processed'])
def test_symlinked_folders_rejected(project, tmp_path, folder):
    outside = tmp_path / 'outside'
    outside.mkdir()
    (project / folder).rmdir()
    (project / folder).symlink_to(outside, target_is_directory=True)
    with pytest.raises(ValueError):
        audio.list_project(project.name)
    assert list(outside.iterdir()) == []


def test_symlink_audio_and_metadata_rejected(project, tmp_path):
    external = tone(tmp_path / 'external.wav')
    (project / '00_source/escape.wav').symlink_to(external)
    with pytest.raises(ValueError):
        audio.analyze(project.name, '00_source/escape.wav')
    notes = project / 'notes.md'
    notes.unlink()
    notes.symlink_to(external)
    saved = external.read_bytes()
    with pytest.raises(ValueError):
        audio.add_note(project.name, 'Do not write outside')
    assert external.read_bytes() == saved


def test_plugin_folder_guard(project, tmp_path, monkeypatch):
    import pedalboard
    loader = Mock()
    monkeypatch.setattr(pedalboard, 'load_plugin', loader)
    with pytest.raises(ValueError, match='Plugins must be inside'):
        audio._build_effect({'type': 'plugin', 'path': str(tmp_path / 'untrusted.vst3')})
    trusted = tmp_path / 'trusted'
    trusted.mkdir()
    monkeypatch.setattr(audio, 'PLUGIN_DIRS', (trusted,))
    outside = tmp_path / 'outside.vst3'
    outside.mkdir()
    (trusted / 'escape.vst3').symlink_to(outside, target_is_directory=True)
    with pytest.raises(ValueError):
        audio._build_effect({'type': 'plugin', 'path': str(trusted / 'escape.vst3')})
    loader.assert_not_called()
    plugin = trusted / 'test.vst3'
    plugin.mkdir()
    audio._build_effect({'type': 'plugin', 'path': str(plugin), 'params': {'gain': .5}})
    loader.assert_called_once()


def test_invalid_chain_and_source_output(project, tmp_path):
    rel = imported(project, tmp_path)
    for chain in [[{'type': 'unknown'}], [{'type': 'gain', 'gain_db': float('nan')}]]:
        with pytest.raises(ValueError):
            audio.apply_chain(project.name, rel, chain)
    with pytest.raises(ValueError):
        audio.apply_chain(project.name, rel, [{'type': 'gain'}], output_dir='00_source')
    assert list((project / '02_processed').iterdir()) == []


@pytest.mark.parametrize('kind', ['highpass', 'lowpass', 'low_shelf', 'high_shelf', 'peak_eq', 'compressor', 'noise_gate', 'limiter'])
def test_builtin_chain_steps(project, tmp_path, kind):
    rel = imported(project, tmp_path)
    result = audio.apply_chain(project.name, rel, [{'type': kind}])
    assert (project / result['output']).is_file()
    json.dumps(result, allow_nan=False)


def test_nonfinite_audio(project, tmp_path):
    sf.write(tmp_path / 'invalid.wav', np.array([np.nan, np.inf]), 48000, subtype='FLOAT')
    audio.import_audio(project.name, str(tmp_path / 'invalid.wav'))
    with pytest.raises(ValueError, match='finite'):
        audio.analyze(project.name, '00_source/invalid.wav')


def test_demucs_mocked(project, tmp_path, monkeypatch):
    rel = imported(project, tmp_path)
    def fake_run(cmd, **kwargs):
        assert cmd[:3] == [sys.executable, '-m', 'demucs']
        assert '--float32' in cmd and '--two-stems' in cmd
        assert kwargs['capture_output'] is True
        assert kwargs['env']['PATH'].startswith('/opt/homebrew/bin:/usr/local/bin:')
        output = Path(cmd[cmd.index('-o') + 1]) / 'htdemucs' / 'synthetic'
        output.mkdir(parents=True)
        tone(output / 'vocals.wav')
        tone(output / 'no_vocals.wav')
        return subprocess.CompletedProcess(cmd, 0, stdout='captured', stderr='')
    monkeypatch.setattr(audio.subprocess, 'run', fake_run)
    for version in ('001', '002'):
        result = audio.separate_stems(project.name, rel, two_stems='vocals')
        assert len(result['stems']) == 2
        assert all(name.endswith(f'_v{version}.wav') for name in result['stems'])
    assert not list(project.glob('.tmp-demucs-*'))
    for kwargs in [{'model': '..'}, {'model': '--bad'}, {'two_stems': 'guitar'}]:
        with pytest.raises(ValueError):
            audio.separate_stems(project.name, rel, **kwargs)


def test_demucs_failure_cleanup(project, tmp_path, monkeypatch):
    rel = imported(project, tmp_path)
    monkeypatch.setattr(audio.subprocess, 'run', lambda *a, **k: subprocess.CompletedProcess(a, 1, stdout='', stderr='synthetic failure'))
    with pytest.raises(RuntimeError, match='synthetic failure'):
        audio.separate_stems(project.name, rel)
    assert not list(project.glob('.tmp-demucs-*'))
    assert history(project)[-1]['status'] == 'failed'


def test_logs_and_listing(project, tmp_path):
    imported(project, tmp_path)
    audio.list_project(project.name)
    audio.add_note(project.name, 'Human listening decision pending.')
    entries = history(project)
    assert [e['action'] for e in entries] == ['new_project', 'import_audio', 'list_project', 'add_note']
    assert all(e['action'] in (project / 'notes.md').read_text() for e in entries)


def test_mcp_stdio_seven_tools(tmp_path):
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    async def run():
        params = StdioServerParameters(command=sys.executable, args=[str(HERE / 'pixie_audio_mcp.py')], env={**os.environ, 'PIXIE_ROOT': str(tmp_path / 'rpc')})
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as client:
                await client.initialize()
                tools = await client.list_tools()
                assert {t.name for t in tools.tools} == {'new_project', 'import_audio', 'separate_stems', 'analyze', 'apply_chain', 'list_project', 'add_note'}
                result = await client.call_tool('new_project', {'name': 'RPC synthetic'})
                assert not result.isError
                result = await client.call_tool('list_project', {'project': 'RPC-synthetic'})
                assert not result.isError
    asyncio.run(run())


def test_setup_config_merge_and_repeat(tmp_path):
    script = (HERE / 'setup_pixie.sh').read_text()
    code = script.split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
    code = code.replace('pathlib.Path.home()', f'pathlib.Path({str(tmp_path)!r})')
    config = tmp_path / 'Library/Application Support/Claude/claude_desktop_config.json'
    config.parent.mkdir(parents=True)
    original = {'otherSetting': True, 'mcpServers': {'existing': {'command': 'keep'}}}
    config.write_text(json.dumps(original))
    for _ in range(2):
        subprocess.run([sys.executable, '-c', code, '/fake/venv/python', '/fake/server.py', '/fake/PIXIE'], check=True, capture_output=True)
    result = json.loads(config.read_text())
    assert result['otherSetting'] is True
    assert result['mcpServers']['existing'] == original['mcpServers']['existing']
    assert result['mcpServers']['pixie-audio']['command'] == '/fake/venv/python'
    backups = list(config.parent.glob('*.backup-*.json'))
    assert len(backups) == 2
    assert all(p.stat().st_mode & 0o777 == 0o600 for p in backups)
    config.write_text('{bad json')
    failure = subprocess.run([sys.executable, '-c', code, '/fake/python', '/fake/server', '/fake/root'], capture_output=True)
    assert failure.returncode != 0 and config.read_text() == '{bad json'
    assert 'mcp[cli]<2' in script and 'torch<2.9' in script and 'torchaudio<2.9' in script
    subprocess.run(['bash', '-n', str(HERE / 'setup_pixie.sh')], check=True)


def test_version_above_999_and_output_path_names(project, tmp_path):
    rel = imported(project, tmp_path)
    (project / '02_processed/synthetic_v999.wav').touch()
    result = audio.apply_chain(project.name, rel, [{'type': 'gain'}])
    assert result['output'].endswith('_v1000.wav')
    result = audio.apply_chain(project.name, result['output'], [{'type': 'gain'}])
    assert result['output'].endswith('synthetic_v1001.wav')
    for name in ['../escape', '/etc/hosts']:
        with pytest.raises(ValueError):
            audio.apply_chain(project.name, rel, [{'type': 'gain'}], output_name=name)


def test_chain_order_is_preserved(project, tmp_path):
    rel = imported(project, tmp_path, amplitude=.8)
    steps = [{'type': 'gain', 'gain_db': 12}, {'type': 'limiter', 'threshold_db': -6}]
    first = audio.apply_chain(project.name, rel, steps)
    second = audio.apply_chain(project.name, rel, list(reversed(steps)))
    assert first['after']['sample_peak_dbfs'] < second['after']['sample_peak_dbfs'] - 5


def test_sibilance_ratio_and_true_peak(project, tmp_path):
    sr = 48000
    t = np.arange(sr) / sr
    data = .2 * np.sin(2 * np.pi * 2000 * t) + .1 * np.sin(2 * np.pi * 7000 * t)
    sf.write(tmp_path / 'bands.wav', data, sr, subtype='FLOAT')
    audio.import_audio(project.name, str(tmp_path / 'bands.wav'))
    result = audio.analyze(project.name, '00_source/bands.wav')
    assert result['sibilance_vs_mid_db'] == pytest.approx(-6.02, abs=.1)
    assert result['true_peak_dbtp'] >= result['sample_peak_dbfs'] - .02


def test_empty_audio_rejected(project, tmp_path):
    sf.write(tmp_path / 'empty.wav', np.empty((0, 1)), 48000)
    audio.import_audio(project.name, str(tmp_path / 'empty.wav'))
    with pytest.raises(ValueError):
        audio.analyze(project.name, '00_source/empty.wav')


def test_setup_rejects_nonmac_without_changes(tmp_path):
    if sys.platform == 'darwin':
        pytest.skip('Linux/macOS rejection is only applicable off macOS')
    result = subprocess.run(['bash', str(HERE / 'setup_pixie.sh')], env={**os.environ, 'PIXIE_ROOT': str(tmp_path / 'not-created')}, capture_output=True)
    assert result.returncode != 0
    assert not (tmp_path / 'not-created').exists()


def test_plugin_worker_output_is_captured(project, tmp_path, monkeypatch):
    rel = imported(project, tmp_path)
    trusted = tmp_path / 'plugins'
    trusted.mkdir()
    (trusted / 'test.vst3').mkdir()
    monkeypatch.setattr(audio, 'PLUGIN_DIRS', (trusted,))
    def fake_run(cmd, **kwargs):
        assert '--render-worker' in cmd
        assert kwargs['capture_output'] is True
        temp = project / cmd[-1]
        np.save(temp / 'output.npy', np.load(temp / 'input.npy', allow_pickle=False))
        return subprocess.CompletedProcess(cmd, 0, stdout='noisy native plugin', stderr='')
    monkeypatch.setattr(audio.subprocess, 'run', fake_run)
    result = audio.apply_chain(project.name, rel, [{'type': 'plugin', 'path': str(trusted / 'test.vst3')}])
    assert (project / result['output']).is_file()
    assert not list(project.glob('.tmp-effects-*'))


def test_real_render_worker_uses_same_file(project, tmp_path):
    rel = imported(project, tmp_path)
    tmp = project / '.tmp-effects-fixture'
    tmp.mkdir()
    data, sr = sf.read(project / rel, always_2d=True)
    np.save(tmp / 'input.npy', data)
    (tmp / 'task.json').write_text(json.dumps({'sr': sr, 'chain': [{'type': 'gain', 'gain_db': -6}]}))
    result = subprocess.run([sys.executable, str(HERE / 'pixie_audio_mcp.py'), '--render-worker', project.name, tmp.name], env={**os.environ, 'PIXIE_ROOT': str(audio.ROOT)}, capture_output=True)
    assert result.returncode == 0, result.stderr
    assert result.stdout == b''
    assert np.max(np.abs(np.load(tmp / 'output.npy'))) == pytest.approx(.2 * 10**(-6/20), rel=.01)


def test_concurrent_renders_are_distinct_and_audited(project, tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    rel = imported(project, tmp_path)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: audio.apply_chain(project.name, rel, [{'type': 'gain', 'gain_db': -3}]), range(2)))
    assert {r['output'] for r in results} == {'02_processed/synthetic_v001.wav', '02_processed/synthetic_v002.wav'}
    assert sum(e['action'] == 'apply_chain' for e in history(project)) == 2
    assert project.stat().st_mode & 0o777 == 0o700
