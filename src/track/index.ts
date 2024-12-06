#!/usr/bin/env node
/* eslint no-console: 'off' */
import { Command, Option } from 'commander'
import login from './commands/login.js'
import logout from './commands/logout.js'
import next from './commands/next.js'
import pause from './commands/pause.js'
import play from './commands/play.js'
import previous from './commands/previous.js'
import track from './commands/track.js'
import volume from './commands/volume.js'

export const program = new Command()

program
  .name('track')
  .description('Control media playback from the command line. Run `track` to get information about the currently playing track.')
  .version('0.0.1', '-v, --version', 'Output the current version.')
  .helpCommand('help [command]', 'Get help for the given command.')
  .addOption(new Option('--debug').hideHelp())
  .option('-b, --book', 'Get more accurate information for audiobooks. This will have a slight impact on performance.')
  .helpOption('-h, --help', 'Get help for the given command.')
  .action(track)

program
  .command('login')
  .description('Get a link to connect your Spotify account with Track.')
  .option('-o, --open', 'Open the link in a browser window.')
  .action(login)

program
  .command('logout')
  .description('Disconnect your Spotify account from Track.')
  .action(logout)

program
  .command('play')
  .description('Resume playback.')
  .action(play)

program
  .command('pause')
  .description('Pause playback.')
  .action(pause)

program
  .command('next')
  .description('Skip to the next track.')
  .action(next)

program
  .command('previous')
  .alias('prev')
  .description('Return to the previous track.')
  .action(previous)

program
  .command('volume')
  .alias('vol')
  .argument('<percent>')
  .description('Set the volume by percentage.')
  .action((percent: string) => volume(percent))

program.parse()
