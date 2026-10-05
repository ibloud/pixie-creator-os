-> arrival
=== arrival ===
# scene:arrival
The Morgue is open. This is a fictional, local demonstration. You can leave at any time.
+ [Enter the case room] -> case_room
+ [Leave the experience] -> exited
=== case_room ===
# scene:case_room
Three case files mark the route to the exit. Choose how this simulated participant proceeds.
+ [Collect the files and reach the exit] -> won
+ [Violet catches the participant] -> lost
+ [Leave the experience] -> exited
=== won ===
# outcome:win
The simulated participant escaped. In the playable prototype, a win reveals the Roomy invitation.
-> END
=== lost ===
# outcome:lose
Caught. No invitation is revealed. Retry when ready, or leave.
+ [Retry the case room] -> case_room
+ [Leave the experience] -> exited
=== exited ===
# outcome:exit
The participant left. The experience is over; no invitation is revealed.
-> END
