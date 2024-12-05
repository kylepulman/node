# Track

Control media playback from the command line.

## `track`

```
Usage: track [options] [command]

Control media playback from the command line. Run `track` with no commands to get information about the currently playing track.

Options:
  -v, --version     Output the current version.
  -b, --book        Get more accurate information for audiobooks. This will have a slight impact on performance.
  -d, --debug       Get complete logging messages.
  -h, --help        Get help for the given command.

Commands:
  login [options]   Get a link to connect your Spotify account with Track.
  logout            Disconnect your Spotify account from Track.
  play              Resume playback.
  pause             Pause playback.
  next              Skip to the next track.
  previous          Return to the previous track.
  volume <percent>  Set the volume by percentage.
```