#!/usr/bin/env node
import { Command } from 'commander'
import { startServerInBackground } from '../lib/index.js'

const program = new Command()

program
  .name('track')
  .action(() => {
    startServerInBackground([`${import.meta.dirname}/server.js`])
  })

program.parse()
