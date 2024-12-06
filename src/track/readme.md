# Track

Control media playback from the command line.

## `track`

```
Usage: track [options] [command]

Control media playback from the command line. Run `track` to get information about the currently playing track.

Options:
  -v, --version     Output the current version.
  -b, --book        Get more accurate information for audiobooks. This will have a slight impact on performance.
  -h, --help        Get help for the given command.

Commands:
  login [options]      Get a link to connect your Spotify account with Track.
  logout               Disconnect your Spotify account from Track.
  play                 Resume playback.
  pause                Pause playback.
  next                 Skip to the next track.
  previous|prev        Return to the previous track.
  volume|vol <percent> Set the volume by percentage.
  help [command]       Get help for the given command.
```

## `track login [options]`

```
Usage: track login [options]

Get a link to connect your Spotify account with Track.

Options:
  -o, --open  Open the link in a browser window.
  -h, --help  Get help for the given command.
```

- Permissions screen
  - User clicks "cancel"
    - State mismatch
    - Access denied
  - User clicks "agree"
    - State mismatch
    - Unknown error
- Request token with authorization code
  - 400: Unsupported grant - grant type is not supported, grant type is missing
  - 400: Invalid grant - invalid redirect URI, invalid auth code
  - 400: Invalid client - bad basic auth
  - 415: Unsupported media type - content type mismatch, 
  - 404: Not found - bad URL
  - 405: Method not allowed
- Get stored data
  - 500: Error retrieving stored token


## `track logout`

```
Usage: track logout [options]

Disconnect your Spotify account from Track.

Options:
  -h, --help  Get help for the given command.
```

## `track play`

```
Usage: track play [options]

Resume playback.

Options:
  -h, --help  Get help for the given command.
```

## `track pause`

```
Usage: track pause [options]

Pause playback.

Options:
  -h, --help  Get help for the given command.
```

## `track next`

```
Usage: track next [options]

Skip to the next track.

Options:
  -h, --help  Get help for the given command.
```

## `track previous`

```
Usage: track previous|prev [options]

Return to the previous track.

Options:
  -h, --help  Get help for the given command.
```

## `track volume <percent>`

```
Usage: track volume|vol [options] <percent>

Set the volume by percentage.

Options:
  -h, --help  Get help for the given command.
```