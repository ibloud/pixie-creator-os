import { App, Notice, Plugin, TFile } from 'obsidian';

interface PixieFrontmatter {
  pixie_id?: string;
  type?: string;
  source?: string;
  source_id?: string;
  status?: string;
  machine_path?: string;
}

export default class PixieCreatorOSPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'open-in-pixie',
      name: 'Open current note in PIXIE',
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return new Notice('PIXIE: no active note.');
        const id = this.pixieId(file);
        const uri = `pixie://open?pixie_id=${encodeURIComponent(id || '')}&file=${encodeURIComponent(file.path)}`;
        window.open(uri, '_blank');
      }
    });

    this.addCommand({
      id: 'show-pixie-id',
      name: 'Show PIXIE ID for current note',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return new Notice('PIXIE: no active note.');
        const id = await this.ensurePixieId(file);
        new Notice(`PIXIE ID: ${id}`);
      }
    });

    this.addCommand({
      id: 'create-pixie-session',
      name: 'Create PIXIE session note',
      callback: async () => {
        const id = crypto.randomUUID();
        const path = await this.uniquePath('PIXIE/Library/Night Bus Session.md');
        const body = [
          '---',
          `pixie_id: ${id}`,
          'type: session',
          'source: pixie-workspace',
          'status: LOCAL',
          '---',
          '',
          '# Night Bus Session',
          '',
          `PIXIE ID: \`${id}\``,
          '',
          'Workspace state is durable here; machine filenames remain implementation details.'
        ].join('\n');
        const file = await this.app.vault.create(path, body);
        await this.app.workspace.getLeaf(true).openFile(file);
        new Notice(`PIXIE session created: ${id}`);
      }
    });
  }

  private pixieId(file: TFile): string | null {
    const cache = this.app.metadataCache.getFileCache(file);
    const value = cache?.frontmatter?.pixie_id;
    return typeof value === 'string' ? value : null;
  }

  private async ensurePixieId(file: TFile): Promise<string> {
    const existing = this.pixieId(file);
    if (existing) return existing;
    const id = crypto.randomUUID();
    await this.app.fileManager.processFrontMatter(file, (fm: PixieFrontmatter) => {
      fm.pixie_id = id;
      fm.type = fm.type || 'note';
      fm.source = fm.source || 'obsidian';
      fm.status = fm.status || 'LOCAL';
    });
    return id;
  }

  private async uniquePath(path: string): Promise<string> {
    if (!this.app.vault.getAbstractFileByPath(path)) return path;
    const dot = path.lastIndexOf('.');
    const base = dot > 0 ? path.slice(0, dot) : path;
    const ext = dot > 0 ? path.slice(dot) : '';
    let i = 2;
    while (this.app.vault.getAbstractFileByPath(`${base} ${i}${ext}`)) i++;
    return `${base} ${i}${ext}`;
  }
}
