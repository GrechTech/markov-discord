import 'source-map-support/register';
import 'reflect-metadata';
import * as Discord from 'discord.js';
import Markov, {
  MarkovGenerateOptions,
  MarkovConstructorOptions,
  AddDataProps,
} from 'markov-strings-db';
import { createConnection } from 'typeorm';
import { MarkovInputData } from 'markov-strings-db/dist/src/entity/MarkovInputData';
import type { PackageJsonPerson } from 'types-package-json';
import makeEta from 'simple-eta';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import addSeconds from 'date-fns/addSeconds';
import type { APIInteractionGuildMember, APISelectMenuComponent } from 'discord-api-types';
import L from './logger';
import { Channel } from './entity/Channel';
import { Guild } from './entity/Guild';
import { config } from './config';
import {
  CHANNEL_OPTIONS_MAX,
  deployCommands,
  helpCommand,
  inviteCommand,
  listenChannelCommand,
  messageCommand,
  trainCommand,
} from './deploy-commands';
import { getRandomElement, getVersion, packageJson } from './util';

const ps2_score_list = [3.8, 3.7, 3.6, 3.8, 3.3, 2.2, 2.6, 2.8, 3.9, 4, 3.7, 4.1, 3.5, 2.2, 3.6, 3.5, 1.7, 3.5, 4.4, 2.2, 2.2, 3.6, 4, 3.7, 3.5, 3.2, 4.3, 0.9, 1.1, 3.9, 3.5, 3.5, 3.4, 3, 2.9, 2.9, 3.2, 2.3, 3.2, 2.7, 3.2, 3.6, 2.7, 3.7, 2.6, 1.7, 2.2, 1.9, 3.3, 3, 3.8, 3, 2.7, 3.2, 1.5, 2.7, 2.8, 2.8, 2.8, 2.9, 3, 3.9, 3.9, 2.4, 3.4, 3.5, 3.9, 3.7, 3.6, 2.9, 3.1, 2.8, 3.5, 3.1, 3, 3.1, 3.5, 2.9, 2.8, 3.5, 1.6, 1.9, 1.8, 4.4, 3.7, 2.2, 4.5, 2.6, 2, 1.7, 3.7, 3.3, 4, 2, 3.8, 4, 4.4, 2.7, 3.2, 2.9, 3, 2.5, 3.8, 3.5, 3.3, 3.5, 4.5, 3.2, 2.7, 3.6, 3.9, 3.9, 3.5, 3.8, 3.9, 4.5, 4.2, 2.7, 3.4, 4.1, 3.3, 3.8, 2.9, 4, 3.6, 3.4, 3.2, 3.8, 4.1, 3.2, 4.5, 3.4, 4.1, 3.2, 2.9, 3.3, 2.5, 3.7, 3.6, 3.9, 3.5, 3.5, 2.7, 3.1, 3.1, 3.7, 2.9, 3.5, 3.2, 2.4, 4.6, 2.2, 3.4, 3.5, 3.5, 3.4, 3.6, 4.1, 3.9, 2.8, 4, 3.2, 3.4, 1.6, 2.7, 3.8, 3.8, 3.8, 4, 2.7, 2.4, 2.9, 3.5, 3.7, 4.1, 3.9, 3.4, 2.5, 2.8, 2.4, 3.3, 3.3, 3.4, 4, 3.4, 3.4, 3.2, 4.2, 2.8, 3.3, 3, 3.2, 4.1, 2.9, 3.3, 0.6, 1.2, 3.8, 2.5, 3.1, 3.4, 4.1, 3.4, 3.4, 3.6, 2.3, 3, 1.2, 2.5, 3.6, 3.6, 3.3, 2.7, 4.6, 3.5, 4, 4.2, 3.6, 4.6, 3.2, 2.9, 3, 2.9, 3.7, 3.4, 1, 3.1, 3.7, 3.4, 3.2, 3.7, 3.1, 3.4, 2.9, 3.4, 3.3, 2.8, 3.4, 3.4, 3.1, 4, 2.8, 3.9, 4.3, 2.4, 4, 3.4, 3.5, 3.3, 2.5, 3.8, 2.6, 4.2, 3.8, 3.9, 4.1, 4.1, 3.8, 2.8, 3.5, 4.5, 4.5, 2.6, 3.3, 3.4, 3.2, 3.1, 3.6, 3.8, 3, 4, 4.2, 3.7, 2.4, 2.9, 4.7, 3.6, 3.2, 3, 3.8, 3.6, 3.3, 3.8, 3.6, 3.8, 3.6, 3.4, 3.8, 3.6, 4.1, 3.5, 2.8, 3.2, 2.9, 3.6, 3.6, 4.2, 4.3, 3.1, 3.8, 1.6, 4.8, 3.6, 3.5, 3.7, 3.2, 3.8, 3.5, 3, 2.2, 3.2, 2.3, 3.5, 0.9, 0.9, 2.1, 2.7, 4, 3.9, 3.6, 2, 2.8, 3.6, 3.7, 3.7, 3.8, 3.9, 3.7, 3.5, 3.9, 3.6, 2.5, 2.5, 3.2, 1.4, 3, 2.5, 3.5, 4.3, 3.4, 2, 2.8, 3.1, 3.3, 4, 2.1, 2.8, 1.7, 2.6, 1.8, 1.3, 3.4, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 3.6, 2.4, 3.8, 2.2, 1.1, 1.6, 3.8, 3.6, 3.6, 3.2, 4, 3.7, 4.7, 4.4, 2.8, 3.4, 3.7, 3.7, 2.7, 3.4, 3.8, 4.7, 2.3, 3.5, 3.6, 3.9, 3.1, 2, 2.8, 4.3, 4, 3.1, 2.8, 3.3, 1, 3.2, 3.1, 1, 4, 2.6, 3.5, 2.8, 3.6, 3.7, 3, 3.6, 3.8, 3.5, 1, 2.3, 2.8, 3, 2.1, 3.6, 3.1, 3.3, 3.1, 2.9, 3.9, 2.6, 2.9, 3.9, 4.3, 3.2, 3.2, 4.2, 4, 3.5, 3.7, 3.1, 2.6, 2.6, 4, 4, 2.3, 3.6, 1.8, 1.4, 3.5, 4, 1, 2.8, 3, 2.5, 2.2, 2.5, 4.2, 3.5, 4, 3.4, 2.6, 3.6, 3.7, 4.2, 4, 3.7, 4.1, 3.5, 4.1, 4.1, 3.1, 3.1, 3.3, 3.8, 3, 3, 4.4, 3.8, 2, 3.6, 3, 3.7, 3.6, 0.5, 3.6, 3.1, 3, 3.1, 3.3, 3.5, 3.6, 3.1, 3.7, 2.6, 3, 2.8, 3.3, 2.3, 3.6, 3.6, 3.9, 4.6, 2.5, 3.5, 3, 3.9, 2.6, 2.6, 3.7, 4, 3.1, 3.2, 3.3, 3.8, 3.6, 3.5, 3.6, 0.5, 3.3, 1.3, 3.4, 3.7, 3.6, 3.8, 3.3, 3.7, 3.5, 3.9, 3.5, 4.1, 3.5, 3.8, 3.1, 2.5, 4.1, 4.2, 3.4, 3.6, 2.4, 3.1, 2.8, 2.3, 3.5, 2.4, 3.9, 3.2, 3.4, 3.7, 3.7, 3, 3.9, 3.4, 3, 3.9, 2.6, 3.5, 4, 3.8, 1.6, 3, 1.8, 2.4, 1.4, 2.1, 4.2, 4.3, 4.4, 3.8, 3.9, 3.9, 4, 3.4, 4.1, 2.8, 3.6, 1.7, 3.2, 2, 3.5, 3.4, 3.7, 4, 4.2, 4.2, 3.9, 3.8, 3.2, 3.1, 3.9, 2.5, 3.2, 3.5, 3.9, 3, 3.1, 2.6, 3.3, 1.8, 3.2, 3.5, 3.2, 3.3, 3.7, 2.4, 2.8, 4, 3.2, 2, 4.3, 4.6, 4, 3.7, 4.6, 3.4, 3.1, 3.7, 3.9, 3.9, 4.2, 3.2, 3.8, 2.9, 3.4, 3.5, 3.7, 2.8, 3.4, 3.4, 2.9, 3.5, 2.9, 3.8, 4.8, 3.5, 3, 3.3, 2.4, 2.4, 2.9, 3.7, 3.5, 3.5, 3, 3.1, 2.9, 3.3, 3, 3.8, 2.6, 2.8, 3.5, 4.8, 4.8, 2.5, 3.2, 2.4, 2.7, 3.6, 3.3, 4.4, 2.3, 2.9, 3.5, 4, 3.3, 1.9, 3.7, 4.2, 3.1, 3.8, 3.3, 2.6, 3.9, 3.1, 3.7, 3.4, 2.8, 3.4, 1.2, 3.5, 1.5, 3.5, 3.9, 3.8, 4, 2.3, 3.4, 3, 2.7, 1.8, 1.6, 3, 2.8, 4, 4.4, 3.4, 3.5, 3.9, 3.4, 3.2, 2.2, 3.1, 3.3, 2.8, 2.8, 3, 4.2, 2.7, 3, 3.7, 4.2, 4.6, 4.5, 4.1, 3.2, 4.2, 3.7, 3.7, 2.8, 2.4, 3.8, 2.9, 3.5, 3.8, 3.8, 3.7, 3.4, 4, 3.5, 2.8, 2.9, 3.6, 3.8, 2.9, 3.6, 3.4, 4.2, 2.6, 2.7, 2.5, 3, 3.8, 3.1, 3, 4.1, 3.1, 3, 4.3, 3.9, 2.4, 2.8, 1.8, 3.8, 2.8, 3.7, 3.8, 3.5, 2.6, 2.5, 4.2, 3.3, 3.4, 4.2, 3.5, 3.5, 2.9, 4.2, 3.3, 3, 4.4, 3.7, 4.2, 3.3, 3.5, 4.8, 3.7, 3.1, 3.2, 3.4, 4.2, 3, 4, 3.3, 3.9, 3.7, 2.2, 4, 4.2, 3.4, 3, 3.4, 3, 3.7, 3.4, 2.6, 3.9, 4.4, 3.3, 4.2, 2.8, 3.1, 3.9, 1.5, 1.9, 1.9, 3.4, 3.1, 3.6, 3.5, 3.4, 3.8, 2.6, 4.1, 3.5, 2.5, 2.9, 2.3, 3.3, 4.2, 2.8, 4.1, 4.1, 2.5, 2.3, 1.7, 3.8, 3.6, 2.8, 3.6, 3.5, 3.4, 1.5, 2.8, 2.5, 3.2, 3.6, 3, 2.9, 1.9, 2.9, 3.4, 2, 3.3, 2.3, 3.8, 3.6, 4.1, 3.4, 3.5, 2.9, 3.3, 3.8, 3.4, 2.8, 3, 1.4, 4, 4.3, 3.8, 4, 2.9, 3.7, 2.9, 3.3, 3.2, 1.7, 3.5, 3.8, 3.3, 4.3, 4, 4, 2.4, 3.4, 3.5, 3.3, 3.3, 3.1, 3.7, 3.2, 4.3, 3.1, 4.3, 4.1, 3.6, 4, 4.1, 3.7, 3.5, 3.8, 4, 3.5, 4, 4, 3.7, 3.8, 3, 3.1, 3.1, 3.2, 2, 0.5, 3.4, 3.6, 4, 4.2, 3.4, 3.5, 4.4, 2.6, 3.7, 4.2, 4.2, 2.7, 2.1, 4.8, 2, 3.6, 3.9, 3.9, 3.4, 4.5, 4.4, 3.9, 4.5, 3.9, 3.8, 4, 3, 3.8, 3.9, 3.9, 2.7, 3.3, 3.9, 3.5, 3.3, 3, 4.2, 3.9, 2.8, 3, 2.4, 3.4, 2.2, 3.3, 3.7, 1.7, 2, 3.7, 2.3, 2.8, 3, 2.9, 2.7, 2.7, 3.5, 2.8, 3, 3.7, 2.2, 3.6, 2.8, 2.5, 3.4, 3, 3.8, 4, 3.1, 1.5, 4.1, 3.5, 4, 3.9, 3.4, 3.6, 3.8, 2.8, 3.6, 3, 3.9, 2.3, 2.5, 4, 3.9, 3.3, 3.3, 3.5, 3.2, 3.2, 3.4, 2.6, 3.7, 3.6, 3.7, 4.2, 1.1, 1.8, 3.4, 3, 3.3, 4.4, 4.3, 4, 4.5, 3.7, 3.6, 3.4, 4.4, 2.2, 3, 2.8, 2.9, 3, 3.2, 3.3, 3.8, 4.1, 3.7, 3.5, 4.3, 4.1, 3.4, 2.5, 2.4, 2.9, 2.6, 4, 4.6, 3.5, 3, 3.3, 3.6, 3.1, 3.4, 3.8, 3.5, 3.3, 3.7, 4, 3.5, 3, 3.2, 1.8, 2.8, 1.5, 2.9, 2.6, 2.2, 2.2, 3.8, 3.3, 3.5, 3.8, 3.3, 2.5, 3.2, 3, 3.8, 3.2, 3, 3.4, 4.1, 1.1, 4, 3.6, 3.1, 3.9, 3.6, 3.2, 3.9, 3.5, 3.5, 2.7, 1.8, 3.3, 2.6, 2, 2.8, 2.6, 4.1, 3, 2.6, 3.1, 2, 3.4, 3.8, 4, 2.7, 2.1, 1, 3.1, 3.4, 4, 3, 3.7, 4.1, 1.3, 3.2, 4, 4.4, 4, 3.8, 3.6, 3.9, 3.9, 4.5, 4.5, 4, 4, 3.8, 3.1, 3.7, 3.6, 3.3, 0.8, 2.7, 2.4, 3.9, 3.1, 3.8, 3.9, 3.1, 2.2, 3.9, 4.3, 4.4, 4.4, 4.1, 4.1, 3.9, 3.5, 3.9, 4.2, 4.4, 4.7, 4, 3.8, 3.7, 3.7, 2.4, 2.9, 3.3, 2.8, 2.9, 3, 2.8, 2.8, 2.8, 2.8, 3.4, 4.5, 3.9, 3, 4.2, 3, 3.5, 3.9, 1.5, 4.5, 3.3, 3.2, 2.8, 3.6, 1.6, 3.9, 3.3, 2.6, 1.3, 0.8, 3.9, 4.5, 4, 3.1, 2.1, 2.9, 3.2, 2.9, 4.1, 4.7, 3.5, 3.3, 4, 4.3, 3.5, 3.7, 3, 3.1, 2.8, 4, 4, 3.4, 1.8, 2.6, 3.6, 3.6, 3.3, 3.8, 3.7, 4, 2.5, 2.8, 2.3, 3.2, 1.5, 1, 4, 3.5, 3.7, 3, 3.2, 3.5, 3.8, 3.6, 3.5, 3, 3.8, 3.8, 3.9, 3.4, 3.9, 3.6, 3.4, 3.3, 3.3, 3.9, 4, 3.9, 3.6, 3.9, 4.1, 3.4, 3.2, 4.2, 2.8, 3.9, 3.9, 3.6, 3.4, 2.8, 3.2, 3.3, 2.5, 3.3, 3.2, 3.1, 3.4, 3, 3.8, 4.5, 3.6, 4.6, 0.5, 3.7, 4.1, 3.8, 3.3, 2.5, 3.4, 1.5, 3.6, 3.8, 3.9, 3.3, 4.2, 3.3, 3.3, 2.1, 3.6, 2.2, 2.3, 3.9, 4.9, 3.8, 3.7, 3.3, 3.4, 3.9, 3.1, 3, 2.6, 2.3, 3.9, 3.2, 3.5, 3.2, 3.6, 3.5, 4, 3.9, 3.6, 4.3, 4.2, 3.5, 3.9, 3.2, 3.5, 3, 3.9, 3.8, 4.1, 4.4, 4.4, 4.4, 3.3, 3.4, 4.2, 4.2, 4.5, 4.1, 3.9, 2.6, 3.1, 3.1, 3.6, 3.6, 4.2, 4, 3.6, 3.6, 3.8, 3.4, 2, 3.4, 2.9, 2.9, 3.4, 3.7, 4, 3.9, 3.9, 4.1, 4, 3.2, 3.4, 3.4, 3.8, 3.2, 3.7, 3.7, 4.3, 3, 3.3, 3.4, 3.7, 4, 3.4, 3.9, 3.5, 2.1, 3.2, 3.7, 3.4, 3.1, 3.7, 2.3, 2.9, 4.5, 4, 4, 2.5, 3.9, 3.9, 4, 3, 2.9, 3.3, 2.7, 3.2, 4.2, 4.3, 3.6, 3.8, 3.8, 3.8, 3.6, 2.8, 3.3, 3.2, 3.3, 3.8, 4.2, 3.5, 3.3, 3.6, 3.3, 3.7, 3.5, 0.5, 3.7, 1.7, 2.5, 3.9, 4, 3.3, 2.8, 3.8, 4, 2, 3.3, 4.2, 3.5, 3.5, 3.5, 3.1, 3.5, 3.9, 3.5, 3.8, 4.1, 3.3, 3.8, 3.5, 4.1, 3.9, 4.2, 3.5, 2.7, 2.6, 3.8, 3.5, 2.5, 1.8, 2.2, 3.4, 3.5, 3.2, 3.4, 3.5, 3.8, 4.1, 3.5, 3.6, 4, 4.3, 4.2, 4.3, 3.7, 3.8, 3.5, 2.9, 4.3, 4.2, 3.5, 3.5, 3.9, 4.3, 4.2, 3.3, 3.2, 2.8, 3.1, 3.6, 3.7, 3.7, 3.7, 3.8, 3.7, 4, 3.5, 3.6, 3.1, 3.4, 3, 3.9, 3.5, 3.1, 3.6, 3, 3.5, 3.5, 3.4, 3.5, 4, 2.6, 2.8, 3.7, 2.8, 3.4, 3.2, 4.2, 4, 3.7, 3.7, 2.5, 3, 2.6, 2.8, 3.9, 4.1, 3.8, 4, 3.6, 3.7, 3.5, 3, 2.8, 3.7, 2.8, 3, 2.8, 3.4, 3.1, 3.5, 2.6, 3.1, 3.1, 3.3, 4.2, 3.8, 3.2, 3.5, 4.1, 4, 3.6, 3.3, 3.6, 3.9, 4.4, 4.2, 4, 3.8, 3.7, 3.6, 2.5, 3.1, 3, 2.9, 2.6, 2.6, 3.5, 3.1, 3.1, 3.4, 3.5, 2.8, 3.6, 3.4, 3.5, 3.9, 3.3, 3.3, 3.6, 3.2, 3.8, 3.6, 3, 3.7, 2.6, 3.1, 3.9, 4.1, 4.2, 3.6, 3.4, 4.3, 3.4, 3.5, 2.4, 3.3, 2.9, 3.9, 3.2, 1.9, 3.8, 2.8, 4.2, 3.8, 3.4, 3.8, 3, 3.7, 2, 3.6, 3.7, 2.3, 4.2, 2.6, 3.8, 4.2, 3.8, 4, 3.6, 3.6, 3.1, 3.5, 4, 4, 3.7, 3.6, 3.7, 3, 3, 3.8, 3.4, 3.4, 3.5, 2.8, 3.6, 4.1, 2.3, 3.9, 3.6, 4, 4.5, 3.8, 3.7, 2.4, 2.9, 3.5, 3.1, 3.5, 2.5, 1.9, 2.1, 3.6, 3.8, 2.7, 3.2, 4, 3.6, 2.3, 3.5, 3.9, 3.5, 4.3, 3.7, 4.2, 3, 2.2, 1.7, 2.2, 4, 3.5, 4.1, 4.9, 4, 2, 3.5, 4.1, 3.2, 3.3, 3.4, 3.7, 2.7, 2.8, 2.9, 1.8, 2.3, 2.8, 1.4, 4, 3.4, 2.5, 2.5, 3.3, 4.4, 3, 4, 3.8, 3.1, 3.1, 2.3, 2.9, 2.5, 3.1, 2.2, 2.8, 3, 2.5, 2.6, 2.8, 3.4, 3, 3.6, 4, 3.8, 3.7, 3.2, 3.3, 4, 2.4, 3.1, 3.6, 4.2, 3.9, 4.1, 4, 3.6, 3.9, 4.2, 3.1, 3.7, 4.2, 3.2, 3.7, 2.9, 2.8, 2.1, 3.7, 3.6, 3.8, 4.1, 3.3, 3.1, 3, 2.8, 2.4, 3.8, 2.4, 3.5, 0.9, 3.5, 3.3, 3.5, 3.9, 3.6, 2, 4, 3, 3.1, 3.2, 3.3, 3.2, 3.2, 3.3, 3.8, 3.2, 3.5, 4, 4.2, 4.7, 4.1, 4.1, 4.1, 3.9, 4.2, 3.2, 3.3, 4, 1.5, 3.5, 3.1, 3.7, 3.6, 3.5, 3.6, 3.8, 3.2, 2.8, 2.2, 2.3, 3.1, 4, 3.5, 3.5, 3.3, 3.5, 4.2, 3.4, 3.3, 2.8, 3.3, 3.6, 3.4, 3.9, 3.5, 3.6, 2.9, 2.5, 3.5, 4.1, 2.8, 3.5, 3.5, 3.5, 3.6, 3, 3.3, 4, 1.8, 3.8, 3.3, 3.1, 3.2, 3.3, 3.3, 2.5, 3.9, 3.9, 3, 1.3, 1.5, 1.9, 3.9, 3.3, 3.9, 3.6, 3.4, 2.8, 3.4, 4, 4, 3.8, 4, 3.3, 3.7, 1.4, 0.7, 3.1, 3.5, 4, 4, 3.1, 3.5, 4, 3.5, 4, 1.5, 3, 2.5, 3.9, 3.9, 3.9, 4.1, 4.2, 3.9, 3.9, 4, 3.1, 3.2, 2.7, 2.6, 3.3, 2.6, 2.6, 2.7, 2.5, 2.7, 2.8, 2.4, 2.9, 3.3, 3.4, 3.7, 3.6, 3.4, 3.3, 3.7, 3.1, 3.6, 3.4, 4, 3.6, 3.3, 3.6, 3.6, 3.5, 3.7, 3.6, 2, 3.6, 3.5, 3.3, 3.3, 4, 3.8, 3.6, 4.5, 4.1, 3.6, 4, 3.4, 4, 4.1, 4.1, 3.6, 2.9, 3.8, 3.6, 2.9, 3.2, 3.6, 3.9, 3.6, 3.4, 3.4, 3.6, 3.7, 3.3, 3.3, 2, 2.9, 3.7, 2.8, 3.3, 3.4, 4.7, 2.6, 2.7, 4, 4.6, 3.7, 3.9, 3.2, 4.3, 3.1, 3.7, 3, 3.3, 4.2, 2.9, 3.2, 3.1, 3.9, 3.9, 4.1, 3.8, 4, 3.7, 1, 3.8, 4.2, 3.7, 3.2, 3.3, 2.7, 3.2, 3.4, 4.1, 3.7, 3.5, 2.6, 3.6, 3.6, 3.9, 4.3, 3.5, 3.9, 4, 4.2, 3.9, 3.4, 3.4, 3.8, 3.6, 3.3, 3.5, 2.4, 3.6, 3.1, 4, 4.2, 3, 3.6, 3.4, 3.8, 3.9, 4.3, 4.1, 3.8, 4, 3.1, 3, 3.8, 3.4, 3.7, 3.6, 3.8, 3.4, 4.5, 3.6, 3.2, 3.7, 3.8, 3.2, 2.7, 4.2, 3.2, 3.8, 3.8, 3.6, 3.1, 3.5, 3.5, 3.5, 3.3, 3.7, 3.4, 4.1, 3, 3.2, 3.2, 3.3, 3.8, 3.5, 3.7, 3.9, 3.7, 4.5, 3.7, 3.6, 3.6, 3.6, 4, 3.4, 3.4, 3.5, 3.5, 3.5, 3.5, 2.8, 4.2, 4.2, 4, 2.6, 2.5, 1.7, 3.2, 3, 3.2, 3.7, 2.5, 4, 2, 2.9, 3.1, 4.4, 4.3, 3.8, 2.3, 3.4, 3.1, 3, 3.6, 3.9, 1.1, 3.5, 4.2, 3.4, 2.9, 3.9, 3, 1.6, 1.2, 2.2, 3, 1.8, 3.5, 4, 4.1, 4.2, 4, 3.3, 2.5, 1.2, 4.5, 3.3, 4.2, 3.8, 3.9, 2.8, 3.3, 3, 3.8, 3.9, 3.9, 4.5, 4.5, 2.2, 3, 2.9, 3.2, 3.6, 3.2, 4, 3.8
  , 3.2, 4.3, 3.2, 2.1, 3.6, 2.4, 3.4, 3.7, 3.8, 2.5, 3.7, 4.4, 2.9, 3.8, 3.9, 3.8, 3.4, 3.5, 3.2, 2.9, 3.2, 3.4, 3.2, 3.1, 1.1, 3.8, 3.4, 4.6, 3, 3.4, 3.2, 2.7, 4, 3.6, 3.5, 3.8, 3.5, 3.6, 3.3, 3.7, 3.7, 3.2, 3.2, 2.8, 3.1, 4, 3.9, 3.3, 3.7, 3.7, 3.5, 3.4, 3, 4, 3.5, 3, 3.7, 3.9, 2.8, 2.3, 3, 1.8, 4.1, 3.7, 3.5, 3, 3.6, 3.4, 2.5, 3.2, 2.9, 2.9, 4.8, 4.1, 3.8, 1.8, 3.8, 3.5, 1.8, 3, 3.2, 3.4, 3.4, 3.6, 4.1, 4, 3.9, 3.8, 3.7, 3.7, 3.5, 3.9, 3, 3.7, 4, 3.1, 4, 3, 4.4, 3.5, 2.7, 3.1, 3, 3, 2.8, 3.3, 3.6, 3, 2, 2, 3.5, 3.2, 3.9, 4.3, 1.6, 3.5, 3.3, 2.7, 3.9, 2.5, 2.9, 3.3, 3.9, 1, 2.6, 3.7, 3.6, 3.9, 4, 4.7, 4, 3.9, 4.1, 3.7, 4.2, 3.7, 3.7, 3.3, 2.8, 4.6, 2.3, 3.8, 3.6, 3.3, 2.3, 3.7, 4.4, 2.3, 4.5, 3.3, 4.2, 3.7, 4, 3.2, 3.3, 3.6, 3.9, 3.7, 2.8, 3.8, 3.9, 3.6, 3.5, 2.7, 3.5, 3.8, 4.2, 3.2, 3.6, 3.7, 2.9, 3.1, 2, 3.7, 1.9, 3.9, 3, 1.5, 2.9, 3.6, 3.3, 3.5, 3.5, 3.4, 3, 3.5, 3.7, 4, 3.8, 3.2, 3.7, 2.9, 3.7, 3.9, 3.6, 3.8, 2.9, 4.1, 2.6, 3.9, 4.6, 3.4, 2.8, 4.2, 4.5, 4.1, 4.3, 3.4, 2.8, 3.6, 3.7, 3.3, 3.2, 3.5, 3.3, 4.4, 3.4, 3.6, 4, 4, 4.1, 3.7, 3.4, 3.9, 3.7, 3.5, 3.1, 3.6, 3.4, 3.5, 2.3, 3.4, 3.4, 3.2, 3.8, 3.5, 3.2, 3.3, 1.8, 3.8, 3.6, 4.2, 2.8, 3.1, 4.4, 3, 3.3, 0.5, 3.4, 3.4, 3.9, 3.2, 3.5, 2.9, 3, 2.6, 3.7, 3.3, 3, 2.4, 1, 3.7, 3.4, 4.4, 2.5, 2.1, 3.1, 2.9, 3.7, 3.9, 3.6, 3.9, 4, 4.5, 4.2, 4, 2.4, 3.8, 3.4, 3.9, 3.6, 3.9, 3.4, 3.1, 2.7, 3.1, 3, 3, 3.2, 3.7, 1.8, 1.5, 1.9, 1.8, 3.6, 2.4, 3.6, 2.6, 3.6, 3.6, 4, 1.9, 1.8, 3.2, 3.9, 3.8, 0.5, 3.7, 1.2, 4, 3.4, 3.9, 1, 4, 3.5, 3.8, 2.5, 3.5, 3.4, 3.7, 3.5, 4, 3.8, 4.2, 3.6, 3.5, 3.3, 2.6, 3.9, 1.3, 4.6, 3, 3.5, 3.4, 4, 3.4, 3.5, 3.2, 2.4, 4.1, 4.2, 4.1, 4.4, 3.7, 3.2, 3.4, 3.2, 4.1, 2, 2.8, 3.2, 2.7, 1.5, 3.5, 2.6, 3.2, 3.6, 4.2, 4.4, 3.9, 3.5, 3.4, 3.9, 2.8, 4.4, 2.8, 3.6, 3.4, 3.6, 3.3, 3.6, 3.3, 3.5, 3.3, 3.3, 3.1, 2.1, 3.2, 3.4, 2.6, 4, 3.9, 3.5, 3.1, 3.9, 3.5, 2.5, 4.6, 4.4, 2.6, 3.8, 3.8, 3.5, 2.8, 3, 2.9, 3.1, 4.4, 3.2, 4, 3.9, 4.1, 4.2, 2.8, 3.4, 4.2, 3.8, 3.8, 3.5, 3.5, 4.4, 4.4, 3, 2.6, 3.7, 3.5, 3.7, 3.6, 2.6, 3.2, 0.6, 3.6, 3, 3.6, 3.7, 3.9, 4.8, 4.5, 3.9, 3.1, 4.2, 4, 2.9, 4, 3, 2.5, 1.8, 2.3, 1.5, 4.2, 3.5, 4.5, 3.7, 3.7, 3, 3, 3.8, 1.7, 3.3, 2, 3.7, 3.6, 3.6, 3.8, 3.8, 4, 4.1, 3.7, 3.5, 3.1, 3, 2.3, 2.5, 4.1, 4.4, 3, 2.7, 4.5, 4, 4, 3, 3.5, 3.9, 3, 2.7, 3.5, 3.5, 2.3, 1.8, 3.4, 3.4, 3.6, 3.2, 4.4, 3.6, 4, 3 ];

const ps2_list = ["007 - Agent Under Fire", "007 - Everything or Nothing", "007 - From Russia with Love", "007 - Nightfire", "007 - Quantum of Solace", "10 Pin - Champions Alley", "10.000 Bullets", "18 Wheeler - American Pro Trucker", "187 -  Ride or Die", "1945 I & II The Arcade Games", "2002 FIFA World Cup Korea Japan", "21 Card Games", "24 - The Game", "25 to Life", "4X4 Evo 2", "4x4 Evolution", "50 Cent - Bulletproof", "7 Blades", "7 Sins", "7 Wonders of the Ancient World", "A-Train 6", "AC-DC Live - Rock Band Track Pack", "Ace Combat 04 - Shattered Skies", "Ace Combat 5 - The Unsung War", "Ace Combat Zero - The Belkan War", "Ace Lightning", "Aces of War", "Action Girlz Racing", "Action Man A.T.O.M. - Alpha Teens on Machines", "Activision Anthology", "Adiboo and the Energy Thieves", "Adventures of Cookie & Cream, The", "Adventures of Darwin, The", "Adventures of Jimmy Neutron Boy Genius - Attack of the Twonkies, The", "Aeon Flux", "Aero Elite - Combat Academy", "AFL Live - Premiership Edition", "AFL Live 2003", "AFL Live 2004 - Aussie Rules Football", "AFL Premiership 2005", "AFL Premiership 2006", "AFL Premiership 2007", "Agassi Tennis Generation", "Age of Empires II - The Age of Kings", "Agent Hugo - Hula Holiday", "Agent Hugo - Lemoon Twist", "Agent Hugo - RoboRumble", "Agent Hugo", "Aggressive Inline", "Air Raid 3", "Air Ranger - Rescue Helicopter", "AirBlade", "Airborne Troops - Countdown to D-Day", "AirForce Delta Strike", "Akira Psycho Ball", "Alan Hansen's Sports Challenge", "Alarm for Cobra 11 - Vol. II", "Alarm for Cobra 11", "Alarm for Cobra 11 Vol. 2 - Hot Pursuit", "Alex Ferguson's Player Manager 2001", "Alfa Romeo Racing Italiano", "Alias", "Alien Hominid", "Aliens in the Attic", "Aliens Versus Predator - Extinction", "All-Star Baseball 2002", "All-Star Baseball 2003 featuring Derek Jeter", "All-Star Baseball 2004 featuring Derek Jeter", "All-Star Baseball 2005 featuring Derek Jeter", "All-Star Fighters", "Alone in the Dark - The New Nightmare", "Alone in the Dark", "Alpine Racer 3", "Alpine Ski Racing 2007 - Bode Miller vs. Hermann Maier", "Alpine Skiing 2005", "Alter Echo", "Altered Beast", "Alvin and the Chipmunks", "American Chopper", "American Chopper 2 - Full Throttle", "American Idol", "American Tail, An", "AMF Xtreme Bowling", "Amplitude", "AND 1 Streetball", "Animal Soccer World", "Animaniacs - The Great Edgar Hunt", "Ant Bully, The", "Antz Extreme Racing", "Anubis II", "Ape Escape - Pumped & Primed", "Ape Escape 2", "Ape Escape 3", "Aqua Aqua", "Aqua Teen Hunger Force - Zombie Ninja Pro-Am", "Ar tonelico - Melody of Elemia", "Ar tonelico II - Melody of Metafalica", "Arc the Lad - End of Darkness", "Arc the Lad - Twilight of the Spirits", "Arcade Action - 30 Games", "Arcade Classics Volume One", "Arcade USA", "Arcade, The", "Arcana Heart", "Arctic Thunder", "Are You Smarter Than a 5th Grader - Make the Grade", "Area 51", "Arena Football - Road to Glory", "Arena Football", "Armored Core - Last Raven", "Armored Core - Nexus  Disc 1", "Armored Core - Nexus  Disc 2", "Armored Core - Nine Breaker", "Armored Core 2 - Another Age", "Armored Core 2", "Armored Core 3", "Army Men - Air Attack 2", "Army Men - Green Rogue", "Army Men - Major Malfunction", "Army Men - RTS", "Army Men - Sarge's Heroes 2", "Army Men - Sarge's War", "Army Men - Soldiers of Misfortune", "Art of Fighting Anthology", "Arthur and the Invisibles - The Game", "Assault Suits Valken", "Asterix & Obelix - Kick Buttix", "Asterix & Obelix XXL2 - Mission - Las Vegum", "Asterix at the Olympic Games", "Astro Boy - The Video Game", "Astro Boy", "Atari Anthology", "Atelier Iris - Eternal Mana", "Atelier Iris 2 - The Azoth of Destiny", "Atelier Iris 3 - Grand Phantasm", "Athens 2004", "Atlantis III - The New World", "ATV - Quad Power Racing 2", "ATV Offroad Fury", "ATV Offroad Fury 2", "ATV Offroad Fury 3", "ATV Offroad Fury 4", "Australian Idol Sing", "Auto Modellista", "Autobahn Raser - Das Spiel zum Film", "Autobahn Raser IV", "Avatar - The Last Airbender - Into the Inferno", "Avatar - The Last Airbender - The Burning Earth", "Avatar - The Last Airbender", "Azur & Asmar", "B-Boy", "Babe", "Backyard Baseball '09", "Backyard Baseball '10", "Backyard Baseball", "Backyard Basketball", "Backyard Football '08", "Backyard Football '09", "Backyard Football '10", "Backyard Football 2006", "Backyard Sports - Baseball 2007", "Backyard Sports - Basketball 2007", "Backyard Wrestling - Don't Try This at Home", "Backyard Wrestling 2 - There Goes the Neighborhood", "Bad Boys - Miami Takedown", "Bakugan - Battle Brawlers", "Baldur's Gate - Dark Alliance", "Baldur's Gate - Dark Alliance II", "Band Hero", "Barbarian", "Barbie as The Island Princess", "Barbie Horse Adventures - Riding Camp", "Barbie Horse Adventures - Wild Horse Rescue", "Barbie in The 12 Dancing Princesses", "Bard's Tale, The", "Barnyard", "Baroque", "Basketball Xciting", "BASS Strike", "Batman - Rise of Sin Tzu", "Batman - Vengeance", "Batman Begins", "Battle Assault 3 featuring Gundam Seed", "Battle Engine Aquila", "Battlefield 2 - Modern Combat", "Battlestar Galactica", "BCV - Battle Construction Vehicles", "Beach King Stunt Racer", "Beat Down - Fists of Vengeance", "Beatmania", "Bee Movie Game", "Ben 10 - Alien Force", "Ben 10 - Protector of Earth", "Ben 10 Alien Force - Vilgax Attacks", "Ben 10 Ultimate Alien - Cosmic Destruction", "Ben Hur - Blood of Braves", "Beverly Hills Cop", "Beyond Good & Evil", "Biathlon 2008", "Bible Game, The", "Big Idea's Veggie Tales - LarryBoy and the Bad Apple", "Big Mutha Truckers", "Big Mutha Truckers 2", "Bigs 2, The", "Bigs, The", "Biker Mice from Mars", "Billiards Xciting", "Billy the Wizard - Rocket Broomstick Racing", "Bionicle", "Bionicle Heroes", "Black", "Black & Bruised", "Black Market Bowling", "Blade II", "Blitz - The League", "Blood Omen 2 - The Legacy of Kain Series", "Blood Will Tell - Tezuka Osamu's Dororo", "BloodRayne", "BloodRayne 2", "Bloody Roar 3", "Bloody Roar 4", "BlowOut", "BMX XXX", "Board Games Gallery", "Bob the Builder - Festival of Fun", "Bob the Builder Eye Toy", "Bode Miller Alpine Skiing", "Bolt", "Bombastic", "Bomberman Hardball", "Bomberman Kart", "Boogie", "Bouncer, The", "Bowling Xciting", "Boxing Champions", "Bratz - Forever Diamondz", "Bratz - Girlz Really Rock", "Bratz - Rock Angelz", "Bratz - The Movie", "Brave - The Search for Spirit Dancer", "Breath of Fire - Dragon Quarter", "Breeders' Cup - World Thoroughbred Championships", "Brian Lara International Cricket 2005", "Brian Lara International Cricket 2007", "Britney's Dance Beat", "Broken Sword - The Sleeping Dragon", "Brothers in Arms - Earned in Blood", "Brothers in Arms - Road to Hill 30", "Brunswick Pro Bowling", "Buccaneer", "Buffy the Vampire Slayer - Chaos Bleeds", "Bujingai - The Forsaken City", "Bully", "Burnout", "Burnout 2 - Point of Impact", "Burnout 3 - Takedown", "Burnout Dominator", "Burnout Revenge", "Bust-A-Bloc", "Butt Ugly Martians - Zoom or Doom!", "Buzz! Brain of Oz", "Buzz! Brain of the UK", "Buzz! Junior - Ace Racers", "Buzz! Junior - Dino Den", "Buzz! Junior - Jungle Party", "Buzz! Junior - Monster Rumble", "Buzz! Junior - RoboJam", "Buzz! Pop Quiz", "Buzz! The BIG Quiz", "Buzz! The Hollywood Quiz", "Buzz! The Maha Quiz", "Buzz! The Mega Quiz", "Buzz! The Music Quiz", "Buzz! The Schools Quiz", "Buzz! The Sports Quiz", "Cabela's African Safari", "Cabela's Alaskan Adventures", "Cabela's Big Game Hunter 2002", "Cabela's Big Game Hunter 2008", "Cabela's Big Game Hunter 2005 Adventures", "Cabela's Dangerous Hunts", "Cabela's Dangerous Hunts 2", "Cabela's Dangerous Hunts 2009", "Cabela's Deer Hunt - 2004 Season", "Cabela's Deer Hunt 2005 Season", "Cabela's Legendary Adventures", "Cabela's Monster Bass", "Cabela's North American Adventures", "Cabela's Outdoor Adventures 2006", "Cabela's Outdoor Adventures 2010", "Cabela's Trophy Bucks", "Cake Mania - Baker's Challenge", "Call of Duty - Finest Hour", "Call of Duty - World at War - Final Fronts", "Call of Duty 2 - Big Red One", "Call of Duty 3", "Capcom Classics Collection Vol. 1", "Capcom Classics Collection Vol. 2", "Capcom Fighting Evolution", "Capcom vs. SNK 2 - Mark of the Millennium 2001", "Captain Scarlet", "Car Racing Challenge", "Carmen Sandiego - The Secret of the Stolen Drums", "Carol Vorderman's Sudoku", "Cars", "Cars Mater - National Championship", "Cars Race-O-Rama", "CART Fury - Championship Racing", "Cart Kings", "Cartoon Kingdom", "Cartoon Network Racing", "Carwash Tycoon", "Casino Challenge", "Casper - Spirit Dimensions", "Casper and The Ghostly Trio", "Casper's Scare School", "Castle Shikigami 2", "Castlevania - Curse of Darkness", "Castlevania - Lament of Innocence", "Castleween", "Catwoman", "CaveMan Rock", "Cel Damage Overdrive", "Champions - Return to Arms", "Champions of Norrath", "Championship Manager 2006", "Championship Manager 2007", "Championship Manager 5", "Chandragupta - Warrior Prince", "Chaos Legion", "Chaos Wars", "Charlie and the Chocolate Factory", "Charlie's Angels", "Charlotte's Web", "Cheggers Party Quiz", "Chemist Tycoon", "Chess Challenger", "Chessmaster", "Choro Q", "Chronicles of Narnia, The - Prince Caspian", "Chronicles of Narnia, The - The Lion, The Witch and The Wardrobe", "Chulip", "CID The Dummy", "Cinderella", "Circuit Blasters", "Circus Maximus - Chariot Wars", "City Crisis", "City Soccer Challenge", "Classic British Motor Racing", "Clever Kids - Dino Land", "Clever Kids - Pony World", "Clock Tower 3", "Club Football - AC Milan", "Club Football - Ajax Amsterdam", "Club Football - Arsenal", "Club Football - Aston Villa", "Club Football - Borussia Dortmund", "Club Football - Celtic FC", "Club Football - Chelsea FC", "Club Football - FC Barcelona", "Club Football - FC Bayern Munich", "Club Football - FC Internazionale", "Club Football - Hamburger SV", "Club Football - Juventus", "Club Football - Leeds United", "Club Football - Liverpool FC", "Club Football - Manchester United", "Club Football - Rangers FC", "Club Football - Real Madrid",
 "Club Football 2005 - AC Milan", "Club Football 2005 - Ajax Amsterdam", "Club Football 2005 - Arsenal", "Club Football 2005 - Aston Villa FC", "Club Football 2005 - Birmingham City", "Club Football 2005 - Borussia Dortmund", "Club Football 2005 - Celtic FC", "Club Football 2005 - Chelsea FC", "Club Football 2005 - FC Barcelona", "Club Football 2005 - FC Bayern Munchen", "Club Football 2005 - FC Intenazionale", "Club Football 2005 - Hamburger SV", "Club Football 2005 - Juventus", "Club Football 2005 - Liverpool FC", "Club Football 2005 - Manchester United", "Club Football 2005 - Newcastle United", "Club Football 2005 - Olympique de Marseille", "Club Football 2005 - Paris Saint-Germain", "Club Football 2005 - Rangers FC", "Club Football 2005 - Real Madrid", "Club Football 2005 - Tottenham Hotspur", "Clumsy Shumsy", "CMT Presents - Karaoke Revolution - Country", "Cocoto Fishing Master", "Cocoto Kart Racer", "Cocoto Platform Jumper", "Code Lyoko - Quest for Infinity", "Code of the Samurai", "Codename - Kids Next Door - Operation - V.I.D.E.O.G.A.M.E.", "Cold Fear", "Cold Winter", "Colin McRae Rally 04", "Colin McRae Rally 2005", "Colin McRae Rally 3", "College Hoops 2K6", "College Hoops 2K7", "College Hoops 2K8", "Colosseum - Road to Freedom", "Combat Ace", "Combat Elite - WWII Paratroopers", "Commandos 2 - Men of Courage", "Commandos Strike Force", "Conan", "Conflict - Desert Storm", "Conflict - Desert Storm II - Back to Baghdad", "Conflict - Global Terror", "Conflict - Vietnam", "Conflict Zone - Modern War Strategy", "Conspiracy - Weapons of Mass Destruction", "Constantine", "Contra - Shattered Soldier", "Cool Boarders 2001", "Cool Shot", "Coraline", "Corvette", "Corvette Evolution GT", "Counter Terrorist Special Forces - Fire for Effect", "Countryside Bears", "Covert Command", "Crabby Adventure", "Crash - Mind Over Mutant", "Crash 'N' Burn", "Crash Bandicoot - The Wrath of Cortex", "Crash Nitro Kart", "Crash of the Titans", "Crash Tag Team Racing", "Crash Twinsanity", "Crashed", "Crazy Chicken X", "Crazy Frog Arcade Racer", "Crazy Frog Racer", "Crazy Golf - World Tour", "Crazy Golf", "Crazy Taxi", "Crescent Suzuki Racing - Superbikes and Super Sidecars", "Cricket 07", "Cricket 2002", "Cricket 2004", "Cricket 2005", "Crime Life - Gang Wars", "Crimson Sea 2", "Crimson Tears", "Crouching Tiger, Hidden Dragon", "Crusty Demons", "CSI - Crime Scene Investigation - 3 Dimensions of Murder", "Cubix Robots for Everyone - Showdown", "Cue Academy - Snooker, Pool, Billiards", "Culdcept", "Curious George", "Curse - The Eye of Isis", "Cy Girls  Disc 1", "Cy Girls  Disc 2", "Cyber Troopers - Virtual-On Marz", "Cyclone Circus", "D-Unit Drift Racing", "D1 Professional Drift Grand Prix Series", "Da Vinci Code, The", "Daemon Summoner", "Dai Senryaku VII - Modern Military Tactics - Exceed", "Dakar 2", "Dalmatians 3", "Dance - UK", "Dance - UK eXtra Trax", "Dance - UK XL", "Dance - UK XL Lite", "Dance - UK XL Party", "Dance Dance Revolution - Disney Channel Edition", "Dance Dance Revolution Extreme", "Dance Dance Revolution Extreme 2", "Dance Dance Revolution SuperNOVA", "Dance Dance Revolution SuperNOVA 2", "Dance Dance Revolution X", "Dance Dance Revolution X2", "Dance Factory", "Dance Fest", "Dance Party - Club Hits", "Dance Party - Pop Hits", "Dancing Stage Fever", "Dancing Stage Fusion", "Dancing Stage Max", "Dancing with the Stars", "Dark Angel - Vampire Apocalypse", "Dark Cloud", "Dark Cloud 2", "Dark Summit", "Dark Wind", "Darkwatch", "Dave Mirra Freestyle BMX 2", "David Beckham Soccer", "David Douillet Judo", "Dawn of Mana", "DDRMAX - Dance Dance Revolution", "DDRMAX2 - Dance Dance Revolution", "Dead Eye Jim", "Dead to Rights", "Dead to Rights II", "Deadly Strike", "Death by Degrees", "Deep Water", "Deer Hunter", "Def Jam - Fight for NY", "Def Jam - Vendetta", "Defender", "Delta Force - Black Hawk Down - Team Sabre", "Delta Force - Black Hawk Down", "Demolition Girl", "Demon Chaos", "Desi Adda - Games of India", "Despicable Me", "Destroy All Humans!", "Destroy All Humans! 2", "Destruction Derby Arenas", "Detonator", "Deus Ex - The Conspiracy", "Devil Kings", "Devil May Cry", "Devil May Cry 2  Disc 1", "Devil May Cry 2  Disc 2", "Devil May Cry 3 - Dante's Awakening - Special Edition", "Devil May Cry 3 - Dante's Awakening", "Diabolik - The Original Sin", "DICE - DNA Integrated Cybernetic Enterprises", "Die Hard - Vendetta", "Digimon Rumble Arena 2", "Digimon World 4", "Digimon World Data Squad", "Dino Stalker", "Dinosaur Adventure", "Dirge of Cerberus - Final Fantasy VII", "Dirt Track Devils", "Disaster Report", "Disgaea - Hour of Darkness", "Disgaea 2 - Cursed Memories", "Disney G-Force", "Disney Golf", "Disney Move", "Disney Princess - Enchanted Journey", "Disney Sing It", "Disney Sing It! High School Musical 3 - Senior Year", "Disney Sing It! Pop Hits", "Disney TH!NK Fast", "Disney's Chicken Little - Ace in Action", "Disney's Chicken Little", "Disney's Dinosaur", "Disney's Donald Duck - Goin' Quackers", "Disney's Extreme Skate Adventure", "Disney's Kim Possible - What's the Switch", "Disney's Meet the Robinsons", "Disney's Peter Pan - The Legend of Never-Land", "Disney's PK - Out of the Shadows", "Disney's Stitch - Experiment 626", "Disney's Tarzan Untamed", "Disney's The Haunted Mansion", "Disney's The Jungle Book - Rhythm N'Groove", "Disney's Treasure Planet", "Disney's Winnie the Pooh's Rumbly Tumbly Adventure", "DJ - Decks & FX - Claudio Coccoluto Edition", "DJ - Decks & FX - House Edition", "DJ Hero", "DNA - Dark Native Apostle", "DOA2 - Hardcore", "Document of Metal Gear Solid 2, The", "DodgeBall", "Dog Island, The", "Dog's Life", "Dokapon Kingdom", "Don 2 - The Game", "Donkey Xote", "Doomsday Racers", "Dora the Explorer - Dora Saves the Crystal Kingdom", "Dora the Explorer - Dora Saves the Mermaids", "Dora the Explorer - Dora Saves the Snow Princess", "Dora the Explorer - Journey to the Purple Planet", "Dora's Big Birthday Adventure", "Dot Hack G.U. Vol. 1 - Rebirth", "Dot Hack G.U. Vol. 2 - Reminisce", "Dot Hack G.U. Vol. 3 - Redemption", "Dot Hack Part 1 - Infection", "Dot Hack Part 2 - Mutation", "Dot Hack Part 3 - Outbreak", "Dot Hack Part 4 - Quarantine", "Downforce", "Downhill Domination", "Downhill Slalom", "Downtown Run", "Dr. Dolittle", "Dr. Muto", "Dr. Seuss' The Cat in the Hat", "Drag Racer USA", "Dragon Ball Z - Budokai", "Dragon Ball Z - Budokai 2", "Dragon Ball Z - Budokai 3", "Dragon Ball Z - Budokai Tenkaichi", "Dragon Ball Z - Budokai Tenkaichi 2", "Dragon Ball Z - Budokai Tenkaichi 3", "Dragon Ball Z - Infinite World", "Dragon Ball Z - Sagas", "Dragon Blaze", "Dragon Quest VIII - Journey of the Cursed King", "Dragon Rage", "Dragon Sisters", "Dragon's Lair 3D", "Drakan - The Ancients' Gates", "Drakengard", "Drakengard 2", "DRIV3R", "Drive to Survive", "Driven", "Driver - Parallel Lines", "Driving Emotion Type-S", "Drome Racers", "Dropship - United Peace Force", "DT Carnage", "DT Racer", "Dual Hearts", "Duel Masters", "Dukes of Hazzard - Return of the General Lee, The", "Dynamite 100", "Dynasty Tactics", "Dynasty Tactics 2", "Dynasty Warriors - Gundam 2", "Dynasty Warriors 2", "Dynasty Warriors 3 - Xtreme Legends", "Dynasty Warriors 3", "Dynasty Warriors 4 - Empires", "Dynasty Warriors 4 - Xtreme Legends", "Dynasty Warriors 4", "Dynasty Warriors 5 - Empires", "Dynasty Warriors 5 - Xtreme Legends", "Dynasty Warriors 5", "Dynasty Warriors 6", "Eagle Eye Golf", "Earache Extreme Metal Racing", "Ecco the Dolphin - Defender of the Future", "Echo Night Beyond", "Ed, Edd n Eddy - The Mis-Edventures", "Egg Mania - Eggstreme Madness", "eJay Clubworld", "El Tigre - The Adventures of Manny Rivera", "Empire of Atlantis", "Endgame", "Energy Airforce", "Energy Airforce aimStrike!", "England International Football", "Enter the Matrix", "Enthusia Professional Racing", "EOE - Eve of Extinction", "Ephemeral Fantasia", "Eragon", "Escape from Monkey Island", "ESPN College Hoops", "ESPN College Hoops 2K5", "ESPN International Track & Field", "ESPN International Winter Sports 2002", "ESPN Major League Baseball", "ESPN MLS ExtraTime", "ESPN National Hockey Night", "ESPN NBA 2K5", "ESPN NBA 2Night", "ESPN NBA 2Night 2002", "ESPN NBA Basketball", "ESPN NFL 2K5", "ESPN NFL Football", "ESPN NFL PrimeTime 2002", "ESPN NHL 2K5", "ESPN NHL Hockey", "ESPN Winter X - Games Snowboarding", "ESPN Winter X - Games Snowboarding 2002", "ESPN X-Games Skateboarding", "Eternal Poison", "Eternal Quest", "Eternal Ring", "Eureka Seven Vol 1 - The New Wave", "Eureka Seven Vol. 2 - The New Vision", "Euro Rally Champion", "European Tennis Pro", "Everblue", "Everblue 2", "Evergrace", "EverQuest Online Adventures - Frontiers", "EverQuest Online Adventures", "Evil Dead - A Fistful of Boomstick", "Evil Dead - Regeneration", "Evil Twin - Cyprien's Chronicles", "Evolution Skateboarding", "Evolution Snowboarding", "Ex Zeus", "Extermination", "Extreme Sprint 3010", "EyeToy - AntiGrav", "EyeToy - Chat", "EyeToy - Groove", "EyeToy - Kinetic", "EyeToy - Kinetic Combat", "EyeToy - Monkey Mania", "EyeToy - Operation Spy", "EyeToy - Play", "EyeToy - Play 2", "EyeToy - Play 3", "EyeToy Play - Astro Zoo", "EyeToy Play - Hero", "EyeToy Play - PomPom Party", "EyeToy Play - Sports", "F1 2001", "F1 2002", "F1 Career Challenge", "F1 Championship Season 2000", "F1 Racing Championship", "Fairly OddParents! Breakin' Da Rules, The", "Fairly OddParents! Shadow Showdown, The", "Falling Stars", "Fallout - Brotherhood of Steel", "Family Board Games", "Family Feud", "Family Guy", "Fantastic 4", "Fantastic Four - Rise of the Silver Surfer", "Fantavision", "Fast and the Furious, The", "Fatal Frame", "Fatal Frame II - Crimson Butterfly", "Fatal Frame III - The Tormented", "Fatal Fury - Battle Archives Volume 1", "Fatal Fury - Battle Archives Volume 2", "Ferrari Challenge - Trofeo Pirelli", "Ferrari F355 Challenge", "FIFA Soccer 07", "FIFA 14 - Legacy Edition", "FIFA 2001", "FIFA Soccer 06", "FIFA Soccer 08", "FIFA Soccer 09", "FIFA Soccer 10", "FIFA Soccer 11", "FIFA Soccer 12"
 , "FIFA Soccer 13", "FIFA Soccer 2002", "FIFA Soccer 2003", "FIFA Soccer 2004", "FIFA Soccer 2005", "FIFA Street", "FIFA Street 2", "FIFA World Cup - Germany 2006", "Fight Club", "Fight Night 2004", "Fight Night Round 2", "Fight Night Round 3", "FightBox", "Fighter Maker 2", "Fighting Angels", "Fighting Fury", "Final Armada", "Final Fantasy X", "Final Fantasy X-2", "Final Fantasy XI - Chains of Promathia", "Final Fantasy XI - Online", "Final Fantasy XI - Treasures of Aht Urhgan", "Final Fantasy XI - Wings of the Goddess", "Final Fantasy XII", "Final Fight - Streetwise", "Finding Nemo", "Finkles World", "Finny the Fish & the Seven Waters", "Fire Blade", "Fire Heroes", "Fire Pro Wrestling Returns", "Firefighter F.D. 18", "Fisherman's Bass Club", "Fisherman's Challenge", "Fishing Fantasy - BuzzRod", "Fitness Fun", "FlatOut", "FlatOut 2", "Flintstones - Bedrock Racing, The", "Flintstones in Viva Rock Vegas, The", "Flipnic - Ultimate Pinball", "Flow - Urban Dance Uprising", "Flushed Away", "Football Generation", "Forbidden Siren 2", "Ford Bold Moves Street Racing", "Ford Mustang - The Legend Lives", "Ford Racing - Off Road", "Ford Racing 2", "Ford Racing 3", "Ford vs. Chevy", "Forever Kingdom", "Forgotten Realms - Demon Stone", "Formula 1 04", "Formula 1 06", "Formula Challenge", "Formula One 2001", "Formula One 2002", "Formula One 2003", "Formula One 2005", "Forty 4 Party", "Frank Herbert's Dune", "Frankie Dettori Racing", "Franklin - A Birthday Surprise", "Freak Out - Extreme Freeride", "Freaky Flyers", "Free Running", "Freedom Fighters", "Freekstyle", "Freestyle Metal X", "Frequency", "Friends - The One with All the Trivia", "Frogger - Ancient Shadow", "Frogger - The Great Quest", "Frogger Beyond", "Frogger's Adventures - The Rescue", "Front Mission 4", "Fruit Machine Mania", "Fruitfall", "Fugitive Hunter - War on Terror", "Full Spectrum Warrior - Ten Hammers", "Full Spectrum Warrior", "Fullmetal Alchemist 2 - Curse of the Crimson Elixir", "Fullmetal Alchemist and the Broken Angel", "FunkMaster Flex's Digital Hitz Factory", "Fur Fighters - Viggo's Revenge", "Furry Tales", "Futurama", "Future Tactics - The Uprising", "G-Force", "G.I. Joe - The Rise of Cobra", "G1 Jockey", "G1 Jockey 3", "G1 Jockey 4", "Gadget and the Gadgetinis", "Gadget Racers", "Gadget Racers", "Gaelic Games - Football", "Gaelic Games - Football 2", "Gaelic Games - Hurling", "Galactic Wrestling - Featuring Ultimate Muscle", "Galerians - Ash", "Gallop Racer 2001", "Gallop Racer 2003 - A New Breed", "Gallop Racer 2004", "Gallop Racer 2006", "Games Galaxy 2", "Garfield - Lasagna World Tour", "Garfield - Saving Arlene", "Garfield", "Garfield 2", "Gauntlet - Dark Legacy", "Gauntlet - Seven Sorrows", "Gecko Blaster", "Gene Troopers", "Genji - Dawn of the Samurai", "George of the Jungle and the Search for the Secret", "Germany's Next Topmodel 2009", "Get On Da Mic", "Getaway - Black Monday, The", "Getaway, The", "Ghost in the Shell - Stand Alone Complex", "Ghost Master - The Gravenville Chronicles", "Ghost Rider", "Ghost Vibration", "Ghostbusters - The Video Game", "Ghosthunter", "Giants - Citizen Kabuto", "Gift", "Gigawing Generations", "Girl Zone", "Gitaroo Man", "Gladiator - Sword of Vengeance", "Gladius", "Glass Rose", "Global Defence Force - Tactics", "Global Defence Force", "Global Touring Challenge - Africa", "Go Go Copter - Remote Control Helicopter", "Go Go Golf", "Go Kart Rally", "Go, Diego, Go! Great Dinosaur Rescue", "Go, Diego, Go! Safari Rescue", "Goblin Commander - Unleash the Horde", "God Hand", "God of War", "God of War II", "GoDai - Elemental Force", "Godfather, The", "Godzilla - Save the Earth", "Godzilla Unleashed", "Golden Age of Racing", "Golden Compass, The", "GoldenEye - Rogue Agent", "Goosebumps HorrorLand", "Gottlieb Pinball Classics", "Gradius III and IV", "Gradius V", "Graffiti Kingdom", "Gran Turismo 3 - A-Spec", "Gran Turismo 4 - Prologue", "Gran Turismo 4", "Gran Turismo Concept - 2002 Tokyo-Geneva", "Gran Turismo Concept - 2002 Tokyo-Seoul", "Grand Prix Challenge", "Grand Prix Challenge", "Grand Theft Auto - Liberty City Stories", "Grand Theft Auto - San Andreas", "Grand Theft Auto - Vice City", "Grand Theft Auto - Vice City Stories", "Grand Theft Auto III", "Grandia II", "Grandia III  Disc 1", "Grandia III  Disc 2", "Grandia Xtreme", "Gravity Games Bike - Street Vert Dirt", "Great British Football Quiz, The", "Great Escape, The", "Greg Hastings' Tournament Paintball Max'd", "Gregory Horror Show", "Gretzky NHL 06", "Gretzky NHL 2005", "Grim Adventures of Billy & Mandy, The", "GrimGrimoire", "Groove Rider - Slot Car Racing", "Growlanser - Heritage of War", "Growlanser Generations  Disc 1", "Growlanser Generations  Disc 2", "GT Racers", "GT-R 400", "GT-R Touring", "Guerrilla Strike", "Guilty Gear Isuka", "Guilty Gear X", "Guilty Gear X2", "Guilty Gear X2 #Reload - The Midnight Carnival", "Guilty Gear XX Accent Core", "Guilty Gear XX Accent Core Plus", "Guitar Hero - Aerosmith", "Guitar Hero - Metallica", "Guitar Hero - Smash Hits", "Guitar Hero - Van Halen", "Guitar Hero", "Guitar Hero 5", "Guitar Hero Encore - Rocks the 80s", "Guitar Hero II", "Guitar Hero III - Legends of Rock", "Guitar Hero World Tour", "Gumball 3000", "Gun", "Gunbird Special Edition", "Guncom 2", "Gunfighter II - Revenge of Jesse James", "Gungrave - Overdose", "Gungrave", "Gungriffon Blaze", "Guy Game, The", "Habitrail Hamster Ball", "Half-Life", "Hamster Heroes", "Hannah Montana - Spotlight World Tour", "Hannspree Ten Kate Honda SBK", "Hansel & Gretel", "Hanuman - Boy Warrior", "Happy Feet", "Hard Hitter 2", "Hard Hitter Tennis", "Hard Knock High", "Hard Rock Casino", "Hardware - Online Arena", "Harley-Davidson Motorcycles - Race to the Rally", "Harry Potter - Quidditch World Cup", "Harry Potter and the Chamber of Secrets", "Harry Potter and the Goblet of Fire", "Harry Potter and the Half-Blood Prince", "Harry Potter and the Order of the Phoenix", "Harry Potter and the Prisoner of Azkaban", "Harry Potter and the Sorcerer's Stone", "Harvest Moon - A Wonderful Life Special Edition", "Harvest Moon - Save the Homeland", "Harvey Birdman - Attorney at Law", "Hasbro Family Game Night", "Haunting Ground", "Haven - Call of the King", "Hawk Kawasaki Racing", "Headhunter - Redemption", "Headhunter", "Heartbeat Boxing", "Heatseeker", "Heavenly Guardian", "Hello Kitty - Roller Rescue", "Heracles - Battle With The Gods", "Heracles Chariot Racing", "Herdy Gerdy", "Heroes of Might and Magic - Quest for the Dragon Bone Staff", "Heroes of the Pacific", "Hidden Invasion", "High Heat Major League Baseball 2002", "High Heat Major League Baseball 2003", "High Heat Major League Baseball 2004", "High Rollers Casino", "High School Musical - Sing It!", "High School Musical 3 - Senior Year DANCE!", "History Channel, The - Battle for the Pacific", "History Channel, The - Civil War - A Nation Divided", "History Channel, The - Civil War - Secret Missions", "History Channel, The - Great Battles of Rome", "Hitman - Blood Money", "Hitman - Contracts", "Hitman 2 - Silent Assassin", "Hobbit, The", "Home Alone", "Home Run", "Homura", "Hoppie", "Horsez", "Hot Shots Golf 3", "Hot Shots Golf Fore!", "Hot Shots Tennis", "Hot Wheels - Beat That!", "Hot Wheels - Stunt Track Challenge", "Hot Wheels - Velocity X - Maximum Justice", "Hot Wheels - World Race", "HSX HyperSonic.Xtreme", "Hugo - Magic In The Troll Woods", "Hugo Bukkazoom!", "Hugo Cannon Cruise", "Hulk", "Hummer Badlands", "Hunter - The Reckoning Wayward", "Hustle, The - Detroit Streets", "Hype - The Time Quest", "Hyper Street Fighter II - The Anniversary Edition", "I-Ninja", "Ice Age - Dawn of the Dinosaurs", "Ice Age 2 - The Meltdown", "ICO", "IGPX - Immortal Grand Prix", "IHRA Drag Racing - Sportsman Edition", "IHRA Drag Racing 2", "IHRA Professional Drag Racing 2005", "Impossible Mission", "In The Groove", "In the Groove 2", "Incredible Hulk, The - Ultimate Destruction", "Incredible Hulk, The", "Incredibles, The - Rise of the Underminer", "Incredibles, The", "Indiana Jones and the Emperor's Tomb", "Indiana Jones and the Staff of Kings", "Indigo Prophecy", "IndyCar Series", "IndyCar Series 2005", "Innocent Life - A Futuristic Harvest Moon", "Inspector Gadget - Mad Robots Invasion", "Intellivision Lives!", "International Cricket Captain III", "International Cue Club 2", "International Golf Pro", "International Pool Championship", "International Snooker Championship", "International Super Karts", "International Superstar Soccer", "International Superstar Soccer 2", "International Superstar Soccer 3", "International Tennis Pro", "Inuyasha - Feudal Combat", "Inuyasha - The Secret of the Cursed Mask", "Iridium Runners", "Iron Aces 2 - Birds of Prey", "Iron Chef", "Iron Man", "Iron Sea", "Island Xtreme Stunts", "Italian Job, The", "Jackass the Game", "Jacked", "Jackie Chan Adventures", "Jackpot Madness", "Jade Cocoon 2", "Jak 3", "Jak and Daxter - The Lost Frontier", "Jak and Daxter - The Precursor Legacy", "Jak II", "Jak X - Combat Racing", "James Cameron's Dark Angel", "James Pond - Codename Robocod", "Jaws Unleashed", "Jeep Thrills", "Jello", "Jelly Belly - Ballistic Beans", "Jeopardy!", "Jeremy McGrath Supercross World", "Jet Ion Grand Prix", "Jet X2O", "Jetix Puzzle Buzzle", "Jimmy Neutron - Jet Fusion", "Jimmy Neutron Boy Genius", "Johnny Bravo - Date-O-Rama!", "Jonny Moseley Mad Trix", "Judge Dredd - Dredd VS Death", "Juiced", "Juiced 2 - Hot Import Nights", "Jumanji", "Jumper - Griffin's Story", "Junior Board Games", "Junior Sports Basketball", "Jurassic - The Hunted", "Jurassic Park - Operation Genesis", "Just Cause", "Justice League Heroes", "K-1 World Grand Prix", "K.O. King", "Kaan - Barbarian's Blade", "Kaido Racer", "Kao the Kangaroo Round 2", "Karaoke Revolution", "Karaoke Revolution Party", "Karaoke Revolution Presents - American Idol", "Karaoke Revolution Presents - American Idol Encore", "Karaoke Revolution Volume 2", "Karaoke Revolution Volume 3", "Karaoke Stage 2", "Kart Racer", "Katamari Damacy", 
 "Kelly Slater's Pro Surfer", "Kengo - Master of Bushido", "Kessen", "Kessen II", "Kessen III", "Kiddies Party Pack", "Kidz Sports Basketball", "Kidz Sports Ice Hockey", "kill.switch", "Killer7", "Killzone", "Kinetica", "King Arthur", "King of Clubs", "King of Fighters - Maximum Impact", "King of Fighters '98, The - Ultimate Match", "King of Fighters 2000-2001, The  Disc 1", "King of Fighters 2000-2001, The  Disc 2", "King of Fighters 2002-2003, The  Disc 1", "King of Fighters 2002-2003, The  Disc 2", "King of Fighters 2006, The", "King of Fighters Collection, The - The Orochi Saga", "King of Fighters NeoWave, The", "King of Fighters XI, The", "King of Route 66, The", "King's Field - The Ancient City", "Kingdom Hearts", "Kingdom Hearts II", "Kingdom Hearts Re-Chain of Memories", "Klonoa 2 - Lunatea's Veil", "Knight Rider - The Game", "Knight Rider 2", "Knights of the Temple - Infernal Crusade", "Knights of the Temple II", "Knockout Kings 2001", "Knockout Kings 2002", "Konami Kids Playground - Alphabet Circus", "Konami Kids Playground - Dinosaurs - Shapes & Colors", "Konami Kids Playground - Frogger Hop, Skip & Jumpin' Fun", "Konami Kids Playground - Toy Pals Fun with Numbers", "Kung Fu Panda", "Kuon", "Kya - Dark Lineage", "L.A. Rush", "La Pucelle - Tactics", "Lake Masters EX", "Lara Croft Tomb Raider - The Angel of Darkness", "Largo Winch - Empire Under Threat", "Lassie", "Le Avventure di Lupin III - Lupin la Morte, Zenigata l'Amore", "Le Mans 24 Hours", "Le Tour de France - Centenary Edition", "Le Tour de France", "Leaderboard Golf", "League Series Baseball 2", "Legacy of Kain - Defiance", "Legaia 2 - Duel Saga", "Legend of Alon D'ar, The", "Legend of Camelot", "Legend of Herkules", "Legend of Kay", "Legend of Spyro, The - A New Beginning", "Legend of Spyro, The - Dawn of the Dragon", "Legend of Spyro, The - The Eternal Night", "Legend of the Dragon", "Legends of Wrestling", "Legends of Wrestling II", "Legion - The Legend of Excalibur", "LEGO Batman - The Videogame", "LEGO Indiana Jones - The Original Adventures", "LEGO Racers 2", "LEGO Soccer Mania", "LEGO Star Wars - The Video Game", "LEGO Star Wars II - The Original Trilogy", "Leisure Suit Larry - Magna Cum Laude", "Lemmings", "Lemony Snicket's A Series of Unfortunate Events", "Let's Make a Soccer Team!", "Let's Ride! - Silver Buckle Stables", "Lethal Skies Elite Pilot - Team SW", "Lethal Skies II", "Life Line", "Little Britain - The Video Game", "Living World Racing", "LMA Manager 2002", "LMA Manager 2003", "LMA Manager 2004", "LMA Manager 2005", "LMA Manager 2006", "LMA Manager 2007", "London Cab Challenge", "London Racer - Destruction Madness", "London Racer - Police Madness", "London Racer - World Challenge", "London Racer II", "London Taxi - Rush Hour", "Looney Tunes - Acme Arsenal", "Looney Tunes - Back in Action", "Looney Tunes - Space Race", "Lord of the Rings, The - Aragorn's Quest", "Lord of the Rings, The - The Fellowship of the Ring", "Lord of the Rings, The - The Return of the King", "Lord of the Rings, The - The Third Age", "Lord of the Rings, The - The Two Towers", "Lotus Challenge", "Lowrider", "Lucinda Green's Equestrian Challenge", "Lumines Plus", "Lupin the 3rd - Treasure of the Sorcerer King", "Luxor - Pharaoh's Challenge", "Mace Griffin Bounty Hunter", "Mad Maestro!", "Madagascar - Escape 2 Africa", "Madagascar", "Madden NFL 06", "Madden NFL 07", "Madden NFL 08", "Madden NFL 09", "Madden NFL 10", "Madden NFL 11", "Madden NFL 12", "Madden NFL 2001", "Madden NFL 2002", "Madden NFL 2003", "Madden NFL 2004", "Madden NFL 2005", "Made Man - Confessions of the Family Blood", "Mafia", "Magic Pengel - The Quest for Color", "Magna Carta - Tears of Blood", "Major League Baseball 2K10", "Major League Baseball 2K11", "Major League Baseball 2K12", "Major League Baseball 2K5 - World Series Edition", "Major League Baseball 2K5", "Major League Baseball 2K6", "Major League Baseball 2K7", "Major League Baseball 2K8", "Major League Baseball 2K9", "Makai Kingdom - Chronicles of the Sacred Tome", "Maken Shao - Demon Sword", "Malice", "Mambo", "Mana Khemia - Alchemists of Al-Revis", "Mana Khemia 2 - Fall of Alchemy", "Manhunt", "Manhunt 2", "Maniac Mole", "Marc Ecko's Getting Up - Contents Under Pressure", "Margot's Word Brain", "Mark Davis Pro Bass Challenge", "Mark of Kri, The", "Marvel - Ultimate Alliance", "Marvel - Ultimate Alliance 2", "Marvel Nemesis - Rise of the Imperfects", "Marvel Super Hero Squad", "Marvel vs. Capcom 2", "Mary-Kate and Ashley - Sweet 16 - Licensed to Drive", "Mashed - Drive to Survive", "Master Chess", "Master Rallye", "Masters of the Universe - He-Man - Defender of Grayskull", "Mat Hoffman's Pro BMX 2", "Matrix, The - Path of Neo", "Max Payne", "Max Payne 2 - The Fall of Max Payne", "Maximo - Ghosts to Glory", "Maximo vs Army of Zin", "MaXXed Out Racing - Nitro", "MaXXed Out Racing", "Maze Action", "McFarlane's Evil Prophecy", "MDK 2 - Armageddon", "Medal of Honor - European Assault", "Medal of Honor - Frontline", "Medal of Honor - Rising Sun", "Medal of Honor - Vanguard", "Mega Man Anniversary Collection", "Mega Man X - Command Mission", "Mega Man X Collection", "Mega Man X7", "Mega Man X8", "MegaRace 3", "Men in Black II - Alien Escape", "Mercenaries - Playground of Destruction", "Mercenaries 2 - World in Flames", "Mercury Meltdown Remix", "Metal Arms - Glitch in the System", "Metal Gear Solid 2 - Sons of Liberty", "Metal Gear Solid 2 - Substance", "Metal Gear Solid 3 - Snake Eater", "Metal Gear Solid 3 - Subsistence  Disc 1", "Metal Gear Solid 3 - Subsistence  Disc 2", "Metal Gear Solid 3 - Subsistence  Disc 3", "Metal Saga", "Metal Slug 3", "Metal Slug 4 & 5  Disc 1", "Metal Slug 4 & 5  Disc 2", "Metal Slug Anthology", "MetropolisMania", "MetropolisMania 2", "Miami Vice", "Michigan - Report From Hell", "Micro Machines", "Micro Machines V4", "Midnight Club - Street Racing", "Midnight Club 3 - DUB Edition", "Midnight Club 3 - DUB Edition Remix", "Midnight Club II", "Midway Arcade Treasures", "Midway Arcade Treasures 2", "Midway Arcade Treasures 3", "Mighty Mulan", "Mike Tyson Heavyweight Boxing", "Minority Report - Everybody Runs", "Mission Impossible - Operation Surma", "Mister Mosquito", "MLB 06 - The Show", "MLB 07 - The Show", "MLB 08 - The Show", "MLB 09 - The Show", "MLB 10 - The Show", "MLB 11 - The Show", "MLB 2004", "MLB 2005", "MLB 2006", "MLB Power Pros", "MLB Power Pros 2008", "MLB SlugFest - Loaded", "MLB Slugfest 20-03", "MLB Slugfest 20-04", "MLB SlugFest 2006", "Mobile Light Force 2", "Mobile Suit Gundam - Encounters in Space", "Mobile Suit Gundam - Federation vs. Zeon", "Mobile Suit Gundam - Gundam vs. Zeta Gundam", "Mobile Suit Gundam - Journey to Jaburo", "Mobile Suit Gundam - Zeonic Front", "Mobile Suit Gundam Seed - Never Ending Tomorrow", "Moderngroove - Ministry of Sound Edition", "Mojo!", "Monopoly", "Monopoly Party!", "Monster 4x4 - Masters of Metal", "Monster Attack", "Monster Eggs", "Monster House", "Monster Hunter", "Monster Jam - Maximum Destruction", "Monster Jam - Urban Assault", "Monster Jam", "Monster Lab", "Monster Rancher 3", "Monster Rancher 4", "Monster Rancher EVO", "Monster Trux Extreme - Arena Edition", "Monster Trux Extreme - Offroad Edition", "Monsters vs. Aliens", "Monsters, Inc.", "Moorhuhn Fun Kart 2008", "Mortal Kombat - Armageddon", "Mortal Kombat - Deadly Alliance", "Mortal Kombat - Deception  Disc 1", "Mortal Kombat - Deception  Disc 2", "Mortal Kombat - Shaolin Monks", "Moto X Maniac", "Motocross Mania 3", "MotoGP", "MotoGP 07", "MotoGP 08", "MotoGP 2", "MotoGP 3", "MotoGP 4", "Motor Mayhem - Vehicular Combat League", "Motorbike King", "Motorsiege - Warriors of Primetime", "MotorStorm Arctic Edge", "Mountain Bike Adrenaline", "Mouse Police, The", "Mouse Trophy", "Mr. Bean", "Mr. Golf", "MS Saga - A New Dawn", "MTV Music Generator 2", "MTV Music Generator 3 - This Is the Remix", "MTV's Celebrity Deathmatch", "MTX Mototrax", "Mummy Returns, The", "Mummy, The - The Animated Series", "Mummy, The - Tomb of the Dragon Emperor", "Muppets Party Cruise", "Musashi - Samurai Legend", "Music Maker - Deluxe Edition", "Music Maker", "Music Maker Rockstar", "MVP 06 NCAA Baseball", "MVP 07 NCAA Baseball", "MVP Baseball 2003", "MVP Baseball 2004", "MVP Baseball 2005", "MX 2002 featuring Ricky Carmichael", "MX Rider", "MX Superfly", "MX Unleashed", "MX vs. ATV Unleashed", "MX vs. ATV Untamed", "MX World Tour Featuring Jamie Little", "My Horse & Me 2", "My Street", "Myst III - Exile", "Mystic Heroes", "Myth Makers - Orbs of Doom", "Myth Makers - Super Kart GP", "Myth Makers - Trixie in Toyland", "Namco Museum", "Namco Museum 50th Anniversary", "NanoBreaker", "NARC", "Naruto - Ultimate Ninja", "Naruto - Ultimate Ninja 2", "Naruto - Ultimate Ninja 3", "Naruto - Uzumaki Chronicles", "Naruto - Uzumaki Chronicles 2", "Naruto Shippuden - Ultimate Ninja 4", "Naruto Shippuden - Ultimate Ninja 5", "NASCAR - Dirt to Daytona", "NASCAR 06 - Total Team Control", "NASCAR 07", "NASCAR 08", "NASCAR 09", "NASCAR 2001", "NASCAR 2005 - Chase for the Cup", "NASCAR Heat 2002", "NASCAR Thunder 2002", "NASCAR Thunder 2003", "NASCAR Thunder 2004", "Naval Ops - Commander", "Naval Ops - Warship Gunner", "NBA 06", "NBA 07", "NBA 08", "NBA 09 The Inside", "NBA 2K10", "NBA 2K11", "NBA 2K12", "NBA 2K2", "NBA 2K3", "NBA 2K6", "NBA 2K7", "NBA 2K8", "NBA 2K9", "NBA Ballers - Phenom", "NBA Ballers", "NBA Hoopz", "NBA Jam", "NBA Live 06", "NBA Live 07", "NBA Live 08", "NBA Live 09", "NBA Live 2001", "NBA Live 2002", "NBA Live 2003", "NBA Live 2004", "NBA Live 2005", "NBA ShootOut 2001", "NBA ShootOut 2003", "NBA ShootOut 2004", "NBA Starting Five", "NBA Street", "NBA Street V3", "NBA Street Vol. 2", "NCAA Basketball 09", "NCAA College Basketball 2K3", "NCAA College Football 2K3", "NCAA Final Four 2001", "NCAA Final Four 2002", "NCAA Final Four 2003", "NCAA Final Four 2004", "NCAA Football 06", "NCAA Football 07", "NCAA Football 08", "NCAA Football 09", "NCAA Football 10", "NCAA Football 11", "NCAA Football 2002", 
 "NCAA Football 2003", "NCAA Football 2004", "NCAA Football 2005", "NCAA GameBreaker 2001", "NCAA GameBreaker 2003", "NCAA GameBreaker 2004", "NCAA March Madness 06", "NCAA March Madness 07", "NCAA March Madness 08", "NCAA March Madness 2002", "NCAA March Madness 2003", "NCAA March Madness 2004", "NCAA March Madness 2005", "Need for Speed - Carbon", "Need for Speed - Hot Pursuit 2", "Need for Speed - Most Wanted - Black Edition", "Need for Speed - Most Wanted", "Need for Speed - ProStreet", "Need for Speed - Undercover", "Need for Speed - Underground", "Need for Speed - Underground 2", "Neo Contra", "NeoGeo Battle Coliseum", "Neopets - The Darkest Faerie", "NFL 2K2", "NFL 2K3", "NFL Blitz 20-02", "NFL Blitz 20-03", "NFL Blitz Pro", "NFL GameDay 2001", "NFL GameDay 2002", "NFL GameDay 2003", "NFL GameDay 2004", "NFL Head Coach", "NFL Quarterback Club 2002", "NFL Street", "NFL Street 2", "NFL Street 3", "NHL 06", "NHL 07", "NHL 08", "NHL 09", "NHL 2001", "NHL 2002", "NHL 2003", "NHL 2004", "NHL 2005", "NHL 2K10", "NHL 2K3", "NHL 2K6", "NHL 2K7", "NHL 2K8", "NHL 2K9", "NHL FaceOff 2001", "NHL FaceOff 2003", "NHL Hitz 20-02", "NHL Hitz 20-03", "NHL Hitz Pro", "NHRA - Countdown to the Championship 2007", "NHRA Championship Drag Racing", "Ni Hao, Kai-Lan - Super Game Day", "Nicktoons - Attack of the Toybots", "Nicktoons - Battle for Volcano Island", "Nicktoons Movin'", "Nicktoons Unite!", "Nightmare of Druaga, The - Fushigino Dungeon", "Nightshade", "Ninja Assault", "Ninjabread Man", "Nitrobike", "Noble Racing", "Nobunaga's Ambition - Iron Triangle", "Nobunaga's Ambition - Rise to Power", "Noddy and the Magic Book", "NPPL Championship Paintball 2009", "NRA Gun Club", "NYR - New York Race", "Obliterate", "Obscure - The Aftermath", "Obscure", "Ocean Commander", "Odin Sphere", "Offroad Extreme!", "Okage - Shadow King", "Okami", "One Piece - Grand Adventure", "One Piece - Grand Battle", "One Piece - Pirates' Carnival", "One Piece - Round the Land!", "Oni", "Onimusha - Blade Warriors", "Onimusha - Dawn of Dreams  Disc 1", "Onimusha - Dawn of Dreams  Disc 2", "Onimusha - Warlords", "Onimusha 2 - Samurai's Destiny", "Onimusha 3 - Demon Siege", "Open Season", "Operation Air Assault", "Operation Air Assault 2", "Operative, The - No One Lives Forever", "Orphen - Scion of Sorcery", "Outlaw Golf 2", "Outlaw Tennis", "Outlaw Volleyball Remixed", "OutRun 2006 - Coast 2 Coast", "Over the Hedge", "P.T.O. IV - Pacific Theater of Operations", "Pac-Man Fever", "Pac-Man World 2", "Pac-Man World 3", "Pac-Man World Rally", "Pacific Warriors II - Dogfight", "Paddington Bear", "Panzer Elite Action - Fields of Glory", "Panzer Front Ausf.B", "Paparazzi", "PaRappa the Rapper 2", "Paris-Dakar Rally", "Party Carnival", "Party Girls", "PDC World Championship Darts", "PDC World Championship Darts 2008", "Perfect Ace - Pro Tournament Tennis", "Perfect Ace 2 - The Championships", "Petanque Pro", "Peter Jackson's King Kong - The Official Game of the Movie", "Peter Pan", "Petz - Catz 2", "Petz - Dogz 2", "Petz - Horsez 2", "Phantasy Star Universe - Ambition of the Illuminus", "Phantasy Star Universe", "Phantom Brave", "Piglet's Big Game", "Pilot Down - Behind Enemy Lines", "Pimp My Ride - Street Racing", "Pimp My Ride", "Pinball", "Pinball Fun", "Pinball Hall of Fame - The Gottlieb Collection", "Pinball Hall of Fame - The Williams Collection", "Pink Pong", "Pinocchio", "Pipe Mania", "Pirates - Legend of the Black Buccaneer", "Pirates - The Legend of Black Kat", "Pirates of the Caribbean - At World's End", "Pirates of the Caribbean - The Legend of Jack Sparrow", "Pitfall - The Lost Expedition", "Plan, Th3", "Playboy - The Mansion", "Playwize Poker & Casino", "Poker Masters", "Polar Express, The", "Police 24-7", "Police Chase Down", "Pool Paradise - International Edition", "Pool Paradise", "Pool Shark 2", "Pop Star Academy", "PopCap Hits! Vol 1", "PopCap Hits! Vol 2", "PopStar Guitar", "Portal Runner", "Postman Pat", "Power Rangers - Super Legends - 15th Anniversary", "Power Rangers Dino Thunder", "Power Volleyball", "Powerdrome", "Powerpuff Girls, The - Relish Rampage", "Powershot Pinball", "Predator - Concrete Jungle", "Premier Manager 08", "Premier Manager 09", "Premier Manager 2002-2003 Season", "Premier Manager 2003-04", "Premier Manager 2004-2005", "Premier Manager 2005-2006", "Premier Manager 2006-2007", "Pride FC - Fighting Championships", "Primal", "Prince of Persia - The Sands of Time", "Prince of Persia - The Two Thrones", "Prince of Persia - Warrior Within", "Prisoner of War", "Pro Beach Soccer", "Pro Biker 2", "Pro Bull Riders - Out of the Chute", "Pro Evolution Soccer", "Pro Evolution Soccer 2008", "Pro Evolution Soccer 2009", "Pro Evolution Soccer 2010", "Pro Evolution Soccer 2011", "Pro Evolution Soccer 2012", "Pro Evolution Soccer 2013", "Pro Evolution Soccer 2014", "Pro Evolution Soccer Management", "Pro Race Driver", "Pro Rally 2002", "Project - Snowblind", "Project Eden", "Project Minerva Professional", "ProStroke Golf - World Tour 2007", "Pryzm - Chapter One - The Dark Unicorn", "Psi-Ops - The Mindgate Conspiracy", "Psychonauts", "Psyvariar - Complete Edition", "Pump It Up - Exceed", "Punisher, The", "Puyo Pop Fever", "Puzzle Challenge - Crosswords And More!", "Puzzle Maniacs", "Puzzle Party - 10 Games", "Puzzle Quest - Challenge of the Warlords", "Q-Ball - Billiards Master", "Quake III - Revolution", "Que pasa Neng! El videojuego", "Quest for Aladdin's Treasure, The", "Quest For Sleeping Beauty", "R-Racing Evolution", "R-Type Final", "RA.ONE - The Game", "Raceway - Drag & Stock Racing", "Radiata Stories", "Radio Helicopter", "Radio Helicopter II", "Raging Blades", "Raiden III", "Rally Championship", "Rally Fusion - Race of Champions", "Rampage - Total Destruction", "Rapala Pro Bass Fishing 2010", "Rapala Pro Fishing", "Ratatouille", "Ratchet - Deadlocked", "Ratchet & Clank - Going Commando", "Ratchet & Clank - Size Matters", "Ratchet & Clank - Up Your Arsenal", "Ratchet & Clank", "Raw Danger!", "Rayman 2 - Revolution", "Rayman 3 - Hoodlum Havoc", "Rayman Arena", "Rayman Raving Rabbids", "RC Revenge Pro", "RC Sports - Copter Challenge", "RC Toy Machines", "Ready 2 Rumble Boxing - Round 2", "Real Madrid - The Game", "Real Pool", "Real World Golf", "Real World Golf 2007", "Realm of the Dead", "RealPlay Golf", "RealPlay Pool", "RealPlay Puzzlesphere", "RealPlay Racing", "Rebel Raiders - Operation Nighthawk", "Red Baron", "Red Dead Revolver", "Red Faction", "Red Faction II", "Red Ninja - End of Honor", "Red Star, The", "RedCard 20-03", "Reel Fishing III", "Reign of Fire", "Reservoir Dogs", "Resident Evil - Code - Veronica X", "Resident Evil - Dead Aim", "Resident Evil 4", "Resident Evil Outbreak", "Resident Evil Outbreak File #2", "Resident Evil Survivor 2 - Code - Veronica", "Retro - 8 Arcade Classics from Yesteryear", "Return to Castle Wolfenstein - Operation Resurrection", "Rez", "Rhythmic Star!", "Ribbit King  Disc 1", "Ribbit King  Disc 2", "Richard Burns Rally", "Ridge Racer V", "Riding Spirits", "Riding Spirits II", "Riding Star", "Rig Racer 2", "Ring of Red", "Rise of the Kasai", "Rise to Honor", "Risk - Global Domination", "River King - A Wonderful Journey", "RLH - Run Like Hell", "Road Rage 3", "Road Trip", "RoadKill", "Robin Hood - Defender of the Crown", "Robin Hood - The Siege 2", "Robin Hood's Quest", "RoboCop", "Robot Alchemic Drive", "Robot Warlords", "Robot Wars - Arenas of Destruction", "Robotech - Battlecry", "Robotech - Invasion", "Robots", "Rock Band - Country Track Pack", "Rock Band - Metal Track Pack", "Rock Band - Track Pack - Classic Rock", "Rock Band - Track Pack Volume 1", "Rock Band - Track Pack Volume 2", "Rock Band", "Rock Band 2", "Rock University Presents - The Naked Brothers Band - The Video Game", "Rock'N'Roll Adventures", "Rocket Power - Beach Bandits", "Rocky - Legends", "Rocky", "Rogue Galaxy", "Rogue Ops", "Rogue Trooper", "Roland Garros 2005 - Powered by Smash Court Tennis", "Roland Garros French Open 2002", "Roland Garros French Open 2003", "Roller Coaster Funfare", "Rollercoaster World", "Rolling", "Romance of the Three Kingdoms IX", "Romance of the Three Kingdoms VII", "Romance of the Three Kingdoms VIII", "Romance of the Three Kingdoms X", "Romance of the Three Kingdoms XI", "Romancing SaGa", "Room Zoom - Race for Impact", "RPG Maker 3", "RPG Maker II", "RPM Tuning", "RS3 - Racing Simulation Three", "RTL Biathlon 2007", "RTL Biathlon 2009", "RTL Ski Jumping 2003", "RTL Ski Jumping 2004", "RTL Ski Jumping 2005", "RTL Ski Jumping 2006", "RTL Ski Jumping 2007", "RTL Winter Games 2007", "RTL Winter Sports 2009", "RTX - Red Rock", "Ruff Trigger - The Vanocore Conspiracy", "Rugby", "Rugby 06", "Rugby 08", "Rugby 2004", "Rugby 2005", "Rugby Challenge 2006", "Rugby League", "Rugby League 2 - World Cup Edition", "Rugrats - Royal Ransom", "Rule of Rose", "Rumble Racing", "Rumble Roses", "Runabout 3 - Neo Age", "Rune - Viking Warlord", "Rygar - The Legendary Adventure", "S.L.A.I. - Steel Lancer Arena International", "Safari Adventures - Africa", "Saint & Sinner", "Saint Seiya - The Hades", "Saint Seiya - The Sanctuary", "Sakura Wars - So Long, My Love  Disc 1", "Sakura Wars - So Long, My Love  Disc 2", "Salt Lake 2002", "Samurai Aces", "Samurai Champloo - Sidetracked", "Samurai Jack - The Shadow of Aku", "Samurai Shodown Anthology", "Samurai Shodown V", "Samurai Warriors - Xtreme Legends", "Samurai Warriors", "Samurai Warriors 2 - Empires", "Samurai Warriors 2 - Xtreme Legends", "Samurai Warriors 2", "Samurai Western", "SAS - Anti Terror Force", "Saturday Night Speedway", "Savage Skies", "SBK - Superbike World Championship", "SBK-09 - Superbike World Championship", "Scaler", "Scarface - The World Is Yours", "Scooby-Doo! and the Spooky Swamp", "Scooby-Doo! First Frights", "Scooby-Doo! Mystery Mayhem", "Scooby-Doo! Night of 100 Frights", "Scooby-Doo! Unmasked", "SCORE International Baja 1000", "Scorpion King, The - Rise of the Akkadian", "Scrabble - 2003 Edition", "SD Gundam Force - Showdown!", 
 "Sea Monsters - A Prehistoric Adventure", "Sea World - Shamu's Deep Sea Adventures", "Search & Destroy", "Second Sight", "Secret Agent Clank", "Secret Saturdays, The - Beasts of the 5th Sun", "Secret Service", "Secret Weapons Over Normandy", "Seed, The - WarZone", "Seek and Destroy", "Sega Bass Fishing Duel", "Sega Classics Collection", "Sega Genesis Collection", "Sega Soccer Slam", "Sega Sports Tennis", "Sega SuperStars", "Sega Superstars Tennis", "Sengoku Anthology", "Sensible Soccer 2006", "Serious Sam - Next Encounter", "Seven Samurai 20XX", "Shadow Hearts - Covenant  Disc 1", "Shadow Hearts - Covenant  Disc 2", "Shadow Hearts - From the New World", "Shadow Hearts", "Shadow Man - 2econd Coming", "Shadow of Destiny", "Shadow of Ganymede", "Shadow of Rome", "Shadow of the Colossus", "Shadow of Zorro, The", "Shadow the Hedgehog", "Shaman King - Power of Spirit", "Shark Tale", "Shaun Palmer's Pro Snowboarder", "Shaun White Snowboarding", "ShellShock - Nam '67", "Shepherd's Crossing", "Shield, The - The Game", "Shifters", "Shin Megami Tensei - Devil Summoner - Raidou Kuzunoha vs. the Soulless Army", "Shin Megami Tensei - Devil Summoner 2 - Raidou Kuzunoha vs. King Abaddon", "Shin Megami Tensei - Digital Devil Saga", "Shin Megami Tensei - Digital Devil Saga 2", "Shin Megami Tensei - Nocturne", "Shin Megami Tensei - Persona 3", "Shin Megami Tensei - Persona 3 FES", "Shin Megami Tensei - Persona 4", "Shining Force EXA", "Shining Force Neo", "Shining Tears", "Shinobi", "Shinobido - Way of the Ninja", "Shogun's Blade", "Short Track Racing - Trading Paint", "Showdown - Legends of Wrestling", "Shox", "Shrek - Super Party", "Shrek 2", "Shrek Smash n' Crash Racing", "Shrek SuperSlam", "Shrek the Third", "Shrek's Carnival Craze", "Silent Hill - Origins", "Silent Hill - Shattered Memories", "Silent Hill 2", "Silent Hill 3", "Silent Hill 4 - The Room", "Silent Line - Armored Core", "Silent Scope", "Silent Scope 2 - Dark Silhouette", "Silent Scope 3", "Silpheed - The Lost Planet", "Simpsons Game, The", "Simpsons Skateboarding, The", "Simpsons, The - Hit & Run", "Simpsons, The - Road Rage", "Sims 2, The - Castaway", "Sims 2, The - Pets", "Sims 2, The", "Sims, The - Bustin' Out", "Sims, The", "SingStar - Boy Bands vs Girl Bands", "SingStar - The Wiggles", "SingStar '80s", "SingStar '80s", "SingStar '90s", "SingStar '90s", "SingStar", "SingStar ABBA", "SingStar Amped", "SingStar Amped", "SingStar Anthems", "SingStar Bollywood", "SingStar Chart Hits", "SingStar Chartbreaker", "SingStar Country", "SingStar Die Groessten Solokuenstler", "SingStar Die Toten Hosen", "SingStar Fussballhits", "SingStar Hottest Hits", "SingStar Latino", "SingStar Latino", "SingStar Legends", "SingStar Legends", "SingStar Legends", "SingStar Motown", "SingStar Party", "SingStar Pop", "SingStar Pop", "SingStar Pop Hits", "SingStar Pop Vol. 2", "SingStar Queen", "SingStar R&B", "SingStar Rock Ballads", "SingStar Rocks!", "SingStar Rocks!", "SingStar Rocks!", "SingStar Singalong with Disney", "SingStar Summer Party", "SingStar Take That", "Siren", "Sitting Ducks", "Skate Attack", "Skateboard Madness Xtreme Edition", "Ski and Shoot", "Ski Racing 2006", "Ski-doo Snow X Racing", "Sky Odyssey", "Sky Surfer", "SkyGunner", "Skyscraper", "Slam Tennis", "Sled Storm", "Sly 2 - Band of Thieves", "Sly 3 - Honor Among Thieves", "Sly Cooper and the Thievius Raccoonus", "Smarties - Meltdown", "Smash Cars", "Smash Court Tennis - Pro Tournament", "Smash Court Tennis Pro Tournament 2", "Smuggler's Run", "Smuggler's Run 2 - Hostile Territory", "Sniper 2, The", "Sniper Assault", "Sniper Elite", "SNK Arcade Classics Vol. 1", "SnoCross 2 - Featuring Blair Morgan", "Snoopy vs. the Red Baron", "Snow Queen Quest, The", "Snow Rider", "Snow White and the 7 Clever Boys", "Snowboard Racer 2", "Soccer America - International Cup", "Soccer Life 2", "Soccer Life!", "SOCOM - U.S. Navy SEALs - Combined Assault", "SOCOM - U.S. Navy SEALs", "SOCOM 3 - U.S. Navy SEALs", "SOCOM II - U.S. Navy SEALs", "Sol Divide", "Soldier of Fortune - Gold Edition", "Son of the Lion King", "Sonic Gems Collection", "Sonic Heroes", "Sonic Mega Collection Plus", "Sonic Riders - Zero Gravity", "Sonic Riders", "Sonic Unleashed", "Sopranos, The - Road to Respect", "Soul Nomad & the World Eaters", "Soul Reaver 2", "SoulCalibur II", "SoulCalibur III", "Space Channel 5 - Special Edition  Disc 1", "Space Channel 5 - Special Edition  Disc 2", "Space Chimps", "Space Invaders - Invasion Day", "Space Invaders Anniversary", "Space Rebellion", "Space War Attack", "Spartan - Total Warrior", "Spawn - Armageddon", "Special Forces", "Spectral vs Generation", "Speed Challenge - Jacques Villeneuve's Racing Vision", "Speed Kings", "Speed Machines III", "Speed Racer", "Speedboat GP", "Sphinx and the Cursed Mummy", "Spider-Man - Friend or Foe", "Spider-Man - The Movie", "Spider-Man - Web of Shadows", "Spider-Man 2", "Spider-Man 3", "Spiderwick Chronicles, The", "SpinDrive Ping Pong", "Splashdown - Rides Gone Wild", "Splashdown", "Splatter Master", "SpongeBob SquarePants - Battle for Bikini Bottom", "SpongeBob SquarePants - Creature from the Krusty Krab", "SpongeBob SquarePants - Lights, Camera, Pants!", "SpongeBob SquarePants - Revenge of the Flying Dutchman", "SpongeBob SquarePants featuring Nicktoons - Globs of Doom", "SpongeBob SquarePants Movie, The", "SpongeBob's Atlantis SquarePantis", "Sprint Car Challenge", "Sprint Cars - Road to Knoxville", "Sprint Cars 2 - Showdown at Eldora", "Spy Fiction", "Spy Hunter - Nowhere to Run", "Spy Hunter", "Spy Hunter 2", "Spy vs. Spy", "Spyro - A Hero's Tail", "Spyro - Enter the Dragonfly", "SSX", "SSX 3", "SSX On Tour", "SSX Tricky", "Stacked with Daniel Negreanu", "Star Ocean - Till the End of Time  Disc 1", "Star Ocean - Till the End of Time  Disc 2", "Star Trek - Conquest", "Star Trek - Encounters", "Star Trek - Shattered Universe", "Star Trek - Voyager Elite Force", "Star Wars - Battlefront", "Star Wars - Battlefront II", "Star Wars - Bounty Hunter", "Star Wars - Jedi Starfighter", "Star Wars - Racer Revenge", "Star Wars - Starfighter", "Star Wars - Super Bombad Racing", "Star Wars - The Clone Wars", "Star Wars - The Force Unleashed", "Star Wars Episode III - Revenge of the Sith", "Star Wars The Clone Wars - Republic Heroes", "Starsky & Hutch", "State of Emergency", "State of Emergency 2", "Stealth Force - The War on Terror", "Stealth Force 2", "Steam Express", "Steambot Chronicles", "Steel Dragon EX", "Stella Deus - The Gate of Eternity", "Stock Car Crash", "Stolen", "Strawberry Shortcake - The Sweet Dreams Game", "Street Boyz", "Street Cricket Champions", "Street Cricket Champions 2", "Street Dance", "Street Fighter Alpha Anthology", "Street Fighter Anniversary Collection", "Street Fighter EX3", "Street Golfer", "Street Hoops", "Street Racing Syndicate", "Street Warrior", "Stretch Panic", "Strike Force Bowling", "Stuart Little 3 - Big Photo Adventure", "Stunt GP", "Stuntman", "Stuntman Ignition", "Sub Rebellion", "Suffering, The - Ties That Bind", "Suffering, The", "Suikoden III", "Suikoden IV", "Suikoden Tactics", "Suikoden V", "Sum of All Fears, The", "Summer Athletics - The Ultimate Challenge", "Summer Heat Beach Volleyball", "Summoner", "Summoner 2", "Sunny Garcia Surfing", "Super Bust-A-Move", "Super Bust-A-Move 2", "Super Dragon Ball Z", "Super Farm", "Super Fruit Fall", "Super Monkey Ball Adventure", "Super Monkey Ball Deluxe", "Super PickUps", "Super Rugby League 2", "Super Trucks Racing", "Super-Bikes - Riding Challenge", "Superbike GP", "Supercar Street Challenge", "Superman - Shadow of Apokolips", "Superman Returns", "Surf's Up", "Surfing H3O", "Suzuki Super-Bikes II - Riding Challenge", "Suzuki TT Superbikes - Real Road Racing", "Suzuki TT Superbikes - Real Road Racing Championship", "SVC Chaos - SNK vs. Capcom", "Sven - Goran Eriksson's World Cup Challenge", "Sven - Goran Eriksson's World Cup Manager", "Swashbucklers - Blue vs. Grey", "SWAT - Global Strike Team", "SWAT Siege", "Swing Away Golf", "Sword of Etheria, The", "Sword of the Samurai", "Swords of Destiny", "Syberia", "Syberia II", "Syphon Filter - Dark Mirror", "Syphon Filter - Logan's Shadow", "Syphon Filter - The Omega Strain", "Taiko Drum Master", "Taito Legends", "Taito Legends 2", "Tak - The Great Juju Challenge", "Tak 2 - The Staff of Dreams", "Tak and the Guardians of Gross", "Tak and the Power of Juju", "Tale of Despereaux, The", "Tales of Legendia", "Tales of the Abyss", "Tank Elite", "Taxi 3", "Taxi Rider", "Taz Wanted", "TD Overdrive", "Technic Beat", "Teen Titans", "Teenage Mutant Ninja Turtles - Mutant Melee", "Teenage Mutant Ninja Turtles - Smash-Up", "Teenage Mutant Ninja Turtles", "Teenage Mutant Ninja Turtles 2 - Battle Nexus", "Teenage Mutant Ninja Turtles 3 - Mutant Nightmare", "Tekken 4", "Tekken 5", "Tekken Tag Tournament", "Telly Addicts", "Tenchu - Fatal Shadows", "Tenchu - Wrath of Heaven", "Tengai", "Tennis Court Smash", "Terminator 3 - Rise of the Machines", "Terminator 3 - The Redemption", "Terminator, The - Dawn of Fate", "Test Drive - Eve of Destruction", "Test Drive", "Test Drive Off-Road Wide Open", "Test Drive Unlimited", "Tetris Worlds", "Theme Park Roller Coaster", "They Came from the Skies", "Thing, The", "Thomas & Friends - A Day at the Races", "Thrillville - Off the Rails", "Thrillville", "Thunderbirds", "Thunderstrike - Operation Phoenix", "Tiger Woods PGA Tour 06", "Tiger Woods PGA Tour 07", "Tiger Woods PGA Tour 08", "Tiger Woods PGA Tour 09", "Tiger Woods PGA Tour 10", "Tiger Woods PGA Tour 2001", "Tiger Woods PGA Tour 2002", "Tiger Woods PGA Tour 2003", "Tiger Woods PGA Tour 2004", "Tiger Woods PGA Tour 2005", "Tim Burton's The Nightmare Before Christmas - Oogie's Revenge", "Time Crisis - Crisis Zone", "Time Crisis 3", "Time Crisis II", "TimeSplitters - Future Perfect", "TimeSplitters", "TimeSplitters 2", "Titeuf Mega-compet'", "TMNT", "TNA iMPACT!", "TOCA Race Driver 2 - The Ultimate Racing Simulator", "TOCA Race Driver 3", "Tokobot Plus - Mysteries of the Karakuri", 
 "Tokyo Road Race", "Tokyo Xtreme Racer 3", "Tokyo Xtreme Racer DRIFT", "Tokyo Xtreme Racer DRIFT 2", "Tokyo Xtreme Racer Zero", "Tom & Jerry in War of the Whiskers", "Tom Clancy's Ghost Recon - Advanced Warfighter", "Tom Clancy's Ghost Recon - Jungle Storm", "Tom Clancy's Ghost Recon", "Tom Clancy's Ghost Recon 2", "Tom Clancy's Rainbow Six - Lockdown", "Tom Clancy's Rainbow Six 3", "Tom Clancy's Splinter Cell - Chaos Theory", "Tom Clancy's Splinter Cell - Double Agent", "Tom Clancy's Splinter Cell - Pandora Tomorrow", "Tom Clancy's Splinter Cell", "Tomb Raider - Anniversary", "Tomb Raider - Legend", "Tomb Raider - Underworld", "Tony Hawk's American Wasteland", "Tony Hawk's Downhill Jam", "Tony Hawk's Pro Skater 3", "Tony Hawk's Pro Skater 4", "Tony Hawk's Project 8", "Tony Hawk's Proving Ground", "Tony Hawk's Underground", "Tony Hawk's Underground 2", "Top Angler", "Top Gear Dare Devil", "Top Gun - Combat Zones", "Top Gun", "Top Spin", "Top Trumps - Doctor Who", "Top Trumps Adventures Vol. 1 - Horror & Predators", "Top Trumps Adventures Vol. 2 - Dogs & Dinosaurs", "Torino 2006 - The Official Video Game of the XX Olympic Winter Games", "Torrente 3 - The Protector", "Total Club Manager 2004", "Total Club Manager 2005", "Total Immersion Racing", "Total Overdose - A Gunslinger's Tale in Mexico", "Totally Spies! Totally Party", "Tourist Trophy - The Real Riding Simulator", "Toy Golf Extreme", "Toy Story 3", "Toys Room, The", "Transformers - Revenge of the Fallen", "Transformers - The Game", "Transformers", "TransWorld Surf", "Trapt", "Tribes Aerial Assault", "Trigger Man", "Triple Play 2002", "Triple Play Baseball", "Trivial Pursuit", "Trivial Pursuit Unhinged", "Truck Racer", "Truck Racing 2", "True Crime - New York City", "True Crime - Streets of LA", "Tsugunai - Atonement", "TT Superbikes Legends", "Turbo Trucks", "Turok - Evolution", "Twenty 2 Party", "Twin Caliber", "Twisted Metal - Black", "Twisted Metal - Black Online", "Twisted Metal - Head-On - Extra Twisted Edition", "Ty the Tasmanian Tiger", "Ty the Tasmanian Tiger 2 - Bush Rescue", "Ty the Tasmanian Tiger 3 - Night of the Quinkan", "U-Move Super Sports", "UEFA Challenge", "UEFA Champions League - Season 2001-2002", "UEFA Champions League 2004-2005", "UEFA Champions League 2006-2007", "UEFA Euro 2004 - Portugal", "UEFA EURO 2008 - Austria-Switzerland", "UFC - Sudden Impact", "Ultimate Board Game Collection", "Ultimate Casino", "Ultimate Fighting Championship - Throwdown", "Ultimate Mind Games", "Ultimate Music Quiz, The", "Ultimate Pro Pinball", "Ultimate Spider-Man", "Ultimate Sports Quiz, The", "Ultimate Trivia Quiz, The", "Ultimate TV & Film Quiz, The", "Ultimate World Cup Quiz, The", "Under the Skin", "Underworld - The Eternal War", "Unison - Rebels of Rhythm & Dance", "Unlimited Saga", "Unreal Tournament", "Up", "Urban Chaos - Riot Response", "Urban Constructor", "Urban Extreme", "Urban Freestyle Soccer", "Urban Reign", "Urbz, The - Sims in the City", "USA Racer", "V-Rally 3", "V.I.P.", "Valkyrie Profile 2 - Silmeria", "Vampire Night", "Van Helsing", "Vegas Casino 2", "Vexx", "Victorious Boxers - Ippo's Road to Glory", "Victorious Boxers 2 - Fighting Spirit", "Video Poker & Blackjack", "Vietcong - Purple Haze", "Viewtiful Joe", "Viewtiful Joe 2", "Virtua Cop - Elite Edition", "Virtua Fighter 4 - Evolution", "Virtua Fighter 4", "Virtua Pro Football", "Virtua Quest", "Volleyball Challenge", "Volleyball Xciting", "Wacky Races - Mad Motors", "Wacky Races starring Dastardly & Muttley", "Wacky Zoo GP", "Wakeboarding Unleashed Featuring Shaun Murray", "WALL-E", "Wallace & Gromit - Curse of the Were-Rabbit", "Wallace & Gromit in Project Zoo", "War Chess", "War of the Monsters", "Warhammer 40,000 - Fire Warrior", "WarJetz", "Warriors of Might and Magic", "Warriors Orochi", "Warriors Orochi 2", "Warriors, The", "Warship Gunner 2", "Water Horse, The - Legend of the Deep", "Wave Rally", "Way of the Samurai", "Way of the Samurai 2", "We Love Katamari", "Weakest Link, The", "Wheel of Fortune", "Whiplash", "Whirl Tour", "White Van Racer", "Whiteout", "Who Wants to Be a Millionaire - 2nd Edition", "Who Wants to Be a Millionaire - Party Edition", "Wild Arms 3", "Wild Arms 4", "Wild Arms 5", "Wild Arms Alter Code-F", "Wild Water Adrenaline featuring Salomon", "Wild Wild Racing", "WinBack - Covert Operations", "WinBack 2 - Project Poseidon", "Winning Eleven - Pro Evolution Soccer 2007", "Winter Sports", "Winter Sports 2 - The Next Challenge", "Winter Sports 2008 - The Ultimate Challenge", "Winx Club", "Wipeout Fusion", "Wipeout Pulse", "Without Warning", "Wizardry - Tale of the Forsaken Land", "Women's Volleyball Championship", "Woody Woodpecker - Escape from Buzz Buzzard Park", "World Championship Cards", "World Championship Paintball", "World Championship Poker", "World Championship Poker 2 Featuring Howard Lederer", "World Championship Poker Featuring Howard Lederer - All In", "World Championship Pool 2004", "World Championship Rugby", "World Championship Snooker 2002", "World Championship Snooker 2003", "World Championship Snooker 2004", "World Destruction League - Thunder Tanks", "World Fighting", "World Heroes Anthology", "World of Outlaws - Sprint Cars 2002", "World Poker Tour", "World Racing", "World Racing 2", "World Rally Championship", "World Series Baseball 2K3", "World Series of Poker - Tournament of Champions", "World Series of Poker", "World Series of Poker 2008 - Battle for the Bracelets", "World Snooker Championship 2005", "World Snooker Championship 2007", "World Soccer Winning Eleven 6 International", "World Soccer Winning Eleven 7 International", "World Soccer Winning Eleven 8 International", "World Soccer Winning Eleven 9", "World Super Police", "World Tour Soccer 2002", "World Tour Soccer 2003", "World Tour Soccer 2005", "World Tour Soccer 2006", "World War Zero - IronStorm", "Worms 3D", "Worms 4 - Mayhem", "Worms Blast", "Worms Forts - Under Siege", "Wrath Unleashed", "WRC - Rally Evolved", "WRC 3", "WRC 4", "WRC II Extreme", "Wreckless - The Yakuza Missions", "WTA Tour Tennis", "WWC - World Wrestling Championship", "WWE All Stars", "WWE Crush Hour", "WWE SmackDown vs. Raw 2007", "WWE SmackDown vs. Raw 2008", "WWE SmackDown vs. Raw 2009", "WWE SmackDown vs. Raw 2010", "WWE SmackDown vs. Raw 2011", "WWE SmackDown! Here Comes the Pain", "WWE SmackDown! Shut Your Mouth", "WWE SmackDown! vs. Raw", "WWE SmackDown! vs. Raw 2006", "WWF SmackDown! Just Bring It", "WWI - Aces of the Sky", "WWII - Battle Over Europe", "WWII - Battle Over The Pacific", "WWII - Soldier", "WWII - Tank Battles", "X-Factor, The - Sing", "X-Files, The - Resist or Serve", "X-Men - Next Dimension", "X-Men - The Official Game", "X-Men Legends", "X-Men Legends II - Rise of Apocalypse", "X-Men Origins - Wolverine", "X-Squad", "X-treme Express", "X-treme Quads", "X2 - Wolverine's Revenge", "Xena - Warrior Princess", "Xenosaga Episode I - Der Wille zur Macht", "Xenosaga Episode II - Jenseits von Gut und Boese  Disc 1", "Xenosaga Episode II - Jenseits von Gut und Boese  Disc 2", "Xenosaga Episode III - Also sprach Zarathustra  Disc 1", "Xenosaga Episode III - Also sprach Zarathustra  Disc 2", "XGIII - Extreme G Racing", "XGRA - Extreme G Racing Association", "Xiaolin Showdown", "XII Stag", "XIII", "XS Junior League Soccer", "Xtreme Speed", "Xyanide - Resurrection", "Yakuza", "Yakuza 2", "Yakuza Fury", "Yanya Caballista - City Skater", "Yetisports - Arctic Adventures", "Yourself!Fitness", "Ys - The Ark of Napishtim", "Yu Yu Hakusho - Dark Tournament", "Yu-Gi-Oh! Capsule Monster Coliseum", "Yu-Gi-Oh! GX - The Beginning of Destiny", "Yu-Gi-Oh! The Duelists of the Roses", "Zapper", "Zatch Bell! Mamodo Battles", "Zatch Bell! Mamodo Fury", "Zathura", "Zombie Attack", "Zombie Hunters", "Zombie Hunters 2", "Zombie Virus", "Zombie Zone", "Zone of the Enders - The 2nd Runner", "Zone of the Enders", "Zoo Puzzle", "ZooCube"]

interface MarkovDataCustom {
  attachments: string[];
}

interface SelectMenuChannel {
  id: string;
  listen?: boolean;
  name?: string;
}

var CountSinceOutput = 0;
const RANDOM_MESSAGE_TARGET = 50;
const RANDOM_MESSAGE_CHANCE = 0.02;
const MESSAGE_LIMIT = 10000;

const INVALID_PERMISSIONS_MESSAGE = 'You do not have the permissions for this action.';
const INVALID_GUILD_MESSAGE = 'This action must be performed within a server.';

const client = new Discord.Client<true>({
  intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS],
  presence: {
    activities: [
      {
        type: 'PLAYING',
        name: config.activity,
        url: packageJson().homepage,
      },
    ],
  },
});

const markovOpts: MarkovConstructorOptions = {
  stateSize: config.stateSize,
};

const markovGenerateOptions: MarkovGenerateOptions<MarkovDataCustom> = {
  filter: (result): boolean => {

    //QQ Check similar reference
    let check_refs = true;
    result.refs.forEach(async (ref) => 
    {
      L.trace('Checking refs')
      if(ref.string.includes(result.string))
      {
        check_refs = false;
        L.debug('Reference contains response')
      }
    });

    return (
      result.score >= config.minScore && !result.refs.some((ref) => ref.string === result.string) && check_refs
    );
  },
  maxTries: config.maxTries,
};

async function getMarkovByGuildId(guildId: string): Promise<Markov> {
  const markov = new Markov({ id: guildId, options: { ...markovOpts, id: guildId } });
  L.trace({ guildId }, 'Setting up markov instance');
  await markov.setup(); // Connect the markov instance to the DB to assign it an ID
  return markov;
}

/**
 * Returns a thread channels parent guild channel ID, otherwise it just returns a channel ID
 */
function getGuildChannelId(channel: Discord.TextBasedChannel): string | null {
  if (channel.isThread()) {
    return channel.parentId;
  }
  return channel.id;
}

async function isValidChannel(channel: Discord.TextBasedChannel): Promise<boolean> {
  const channelId = getGuildChannelId(channel);
  if (!channelId) return false;
  const dbChannel = await Channel.findOne(channelId);
  return dbChannel?.listen || false;
}

function isHumanAuthoredMessage(message: Discord.Message | Discord.PartialMessage): boolean {
  return !(message.author?.bot || message.system);
}

async function getValidChannels(guild: Discord.Guild): Promise<Discord.TextChannel[]> {
  L.trace('Getting valid channels from database');
  const dbChannels = await Channel.find({ guild: Guild.create({ id: guild.id }), listen: true });
  L.trace({ dbChannels: dbChannels.map((c) => c.id) }, 'Valid channels from database');
  const channels = (
    await Promise.all(
      dbChannels.map(async (dbc) => {
        const channelId = dbc.id;
        try {
          return guild.channels.fetch(channelId);
        } catch (err) {
          L.error({ erroredChannel: dbc, channelId }, 'Error fetching channel');
          throw err;
        }
      })
    )
  ).filter((c): c is Discord.TextChannel => c !== null && c instanceof Discord.TextChannel);
  return channels;
}

async function getTextChannels(guild: Discord.Guild): Promise<SelectMenuChannel[]> {
  L.trace('Getting text channels for select menu');
  const MAX_SELECT_OPTIONS = 25;
  const textChannels = guild.channels.cache.filter(
    (c): c is Discord.TextChannel => c !== null && c instanceof Discord.TextChannel
  );
  const foundDbChannels = await Channel.findByIds(Array.from(textChannels.keys()));
  const foundDbChannelsWithName: SelectMenuChannel[] = foundDbChannels.map((c) => ({
    ...c,
    name: textChannels.find((t) => t.id === c.id)?.name,
  }));
  const notFoundDbChannels: SelectMenuChannel[] = textChannels
    .filter((c) => !foundDbChannels.find((d) => d.id === c.id))
    .map((c) => ({ id: c.id, listen: false, name: textChannels.find((t) => t.id === c.id)?.name }));
  const limitedDbChannels = foundDbChannelsWithName
    .concat(notFoundDbChannels)
    .slice(0, MAX_SELECT_OPTIONS);
  return limitedDbChannels;
}

async function addValidChannels(channels: Discord.TextChannel[], guildId: string): Promise<void> {
  L.trace(`Adding ${channels.length} channels to valid list`);
  const dbChannels = channels.map((c) => {
    return Channel.create({ id: c.id, guild: Guild.create({ id: guildId }), listen: true });
  });
  await Channel.save(dbChannels);
}

async function removeValidChannels(
  channels: Discord.TextChannel[],
  guildId: string
): Promise<void> {
  L.trace(`Removing ${channels.length} channels from valid list`);
  const dbChannels = channels.map((c) => {
    return Channel.create({ id: c.id, guild: Guild.create({ id: guildId }), listen: false });
  });
  await Channel.save(dbChannels);
}

/**
 * Checks if the author of a command has moderator-like permissions.
 * @param {GuildMember} member Sender of the message
 * @return {Boolean} True if the sender is a moderator.
 *
 */
function isModerator(member: Discord.GuildMember | APIInteractionGuildMember | null): boolean {
  const MODERATOR_PERMISSIONS: Discord.PermissionResolvable[] = [
    'ADMINISTRATOR',
    'MANAGE_CHANNELS',
    'KICK_MEMBERS',
    'MOVE_MEMBERS',
  ];
  if (!member) return false;
  if (member instanceof Discord.GuildMember) {
    return (
      MODERATOR_PERMISSIONS.some((p) => member.permissions.has(p)) ||
      config.ownerIds.includes(member.id)
    );
  }
  // TODO: How to parse API permissions?
  L.debug({ permissions: member.permissions });
  return true;
}

/**
 * Checks if the author of a command has a role in the `userRoleIds` config option (if present).
 * @param {GuildMember} member Sender of the message
 * @return {Boolean} True if the sender is a moderator.
 *
 */
function isAllowedUser(member: Discord.GuildMember | APIInteractionGuildMember | null): boolean {
  if (!config.userRoleIds.length) return true;
  if (!member) return false;
  if (member instanceof Discord.GuildMember) {
    return config.userRoleIds.some((p) => member.roles.cache.has(p));
  }
  // TODO: How to parse API permissions?
  L.debug({ permissions: member.permissions });
  return true;
}

type MessageCommands = 'respond' | 'train' | 'help' | 'invite' | 'debug' | 'tts' | null;

/**
 * Reads a new message and checks if and which command it is.
 * @param {Message} message Message to be interpreted as a command
 * @return {String} Command string
 */
function validateMessage(message: Discord.Message): MessageCommands {
  const messageText = message.content.toLowerCase();
  let command: MessageCommands = null;
  const thisPrefix = messageText.substring(0, config.messageCommandPrefix.length);
  if (thisPrefix === config.messageCommandPrefix) {
    const split = messageText.split(' ');
    if (split[0] === config.messageCommandPrefix && split.length === 1) {
      command = 'respond';
    } else if (split[1] === 'train') {
      command = 'train';
    } else if (split[1] === 'help') {
      command = 'help';
    } else if (split[1] === 'invite') {
      command = 'invite';
    } else if (split[1] === 'debug') {
      command = 'debug';
    } else if (split[1] === 'tts') {
      command = 'tts';
    }
  }
  return command;
}

function messageToData(message: Discord.Message): AddDataProps {
  const attachmentUrls = message.attachments.map((a) => a.url);
  let custom: MarkovDataCustom | undefined;
  if (attachmentUrls.length) custom = { attachments: attachmentUrls };
  const tags: string[] = [message.id];
  if (message.channel.isThread()) tags.push(message.channelId); // Add thread channel ID
  const channelId = getGuildChannelId(message.channel);
  if (channelId) tags.push(channelId); // Add guild channel ID
  if (message.guildId) tags.push(message.guildId); // Add guild ID
  return {
    string: message.content,
    custom,
    tags,
  };
}

/**
 * Recursively gets all messages in a text channel's history.
 */
async function saveGuildMessageHistory(
  interaction: Discord.Message | Discord.CommandInteraction
): Promise<string> {
  if (!isModerator(interaction.member)) return INVALID_PERMISSIONS_MESSAGE;
  if (!interaction.guildId || !interaction.guild) return INVALID_GUILD_MESSAGE;
  const markov = await getMarkovByGuildId(interaction.guildId);
  const channels = await getValidChannels(interaction.guild);

  if (!channels.length) {
    L.warn({ guildId: interaction.guildId }, 'No channels to train from');
    return 'No channels configured to learn from. Set some with `/listen add`.';
  }

  L.debug('Deleting old data');
  await markov.delete();

  const channelIds = channels.map((c) => c.id);
  L.debug({ channelIds }, `Training from text channels`);

  const messageContent = `Parsing past messages from ${channels.length} channel(s).`;

  const NO_COMPLETED_CHANNELS_TEXT = 'None';
  const completedChannelsField: Discord.EmbedFieldData = {
    name: 'Completed Channels',
    value: NO_COMPLETED_CHANNELS_TEXT,
    inline: true,
  };
  const currentChannelField: Discord.EmbedFieldData = {
    name: 'Current Channel',
    value: `<#${channels[0].id}>`,
    inline: true,
  };
  const currentChannelPercent: Discord.EmbedFieldData = {
    name: 'Channel Progress',
    value: '0%',
    inline: true,
  };
  const currentChannelEta: Discord.EmbedFieldData = {
    name: 'Channel Time Remaining',
    value: 'Pending...',
    inline: true,
  };
  const embedOptions: Discord.MessageEmbedOptions = {
    title: 'Training Progress',
    fields: [completedChannelsField, currentChannelField, currentChannelPercent, currentChannelEta],
  };
  const embed = new Discord.MessageEmbed(embedOptions);
  let progressMessage: Discord.Message;
  const updateMessageData = { content: messageContent, embeds: [embed] };
  if (interaction instanceof Discord.Message) {
    progressMessage = await interaction.reply(updateMessageData);
  } else {
    progressMessage = (await interaction.followUp(updateMessageData)) as Discord.Message;
  }

  const PAGE_SIZE = 100;
  const UPDATE_RATE = 1000; // In number of messages processed
  let lastUpdate = 0;
  let messagesCount = 0;
  let firstMessageDate: number | undefined;
  // eslint-disable-next-line no-restricted-syntax
  for (const channel of channels) {
    let oldestMessageID: string | undefined;
    let keepGoing = true;
    L.debug({ channelId: channel.id, messagesCount }, `Training from channel`);
    const channelCreateDate = channel.createdTimestamp;
    const channelEta = makeEta({ autostart: true, min: 0, max: 1, historyTimeConstant: 30 });

    while (keepGoing) {
      let allBatchMessages = new Discord.Collection<string, Discord.Message<boolean>>();
      let channelBatchMessages: Discord.Collection<string, Discord.Message<boolean>>;
      try {
        // eslint-disable-next-line no-await-in-loop
        channelBatchMessages = await channel.messages.fetch({
          before: oldestMessageID,
          limit: PAGE_SIZE,
        });
      } catch (err) {
        L.error(err);
        L.error(
          `Error retreiving messages before ${oldestMessageID} in channel ${channel.name}. This is probably a permissions issue.`
        );
        break; // Give up on this channel
      }

      // Gather any thread messages if present in this message batch
      const threadChannels = channelBatchMessages
        .filter((m) => m.hasThread)
        .map((m) => m.thread)
        .filter((c): c is Discord.ThreadChannel => c !== null);
      if (threadChannels.length > 0) {
        L.debug(`Found ${threadChannels.length} threads. Reading into them.`);
        // eslint-disable-next-line no-restricted-syntax
        for (const threadChannel of threadChannels) {
          let oldestThreadMessageID: string | undefined;
          let keepGoingThread = true;
          L.debug({ channelId: threadChannel.id }, `Training from thread`);

          while (keepGoingThread) {
            let threadBatchMessages: Discord.Collection<string, Discord.Message<boolean>>;
            try {
              // eslint-disable-next-line no-await-in-loop
              threadBatchMessages = await threadChannel.messages.fetch({
                before: oldestThreadMessageID,
                limit: PAGE_SIZE,
              });
            } catch (err) {
              L.error(err);
              L.error(
                `Error retreiving thread messages before ${oldestThreadMessageID} in thread ${threadChannel.name}. This is probably a permissions issue.`
              );
              break; // Give up on this thread
            }
            L.trace(
              { threadMessagesCount: threadBatchMessages.size },
              `Found some thread messages`
            );
            const lastThreadMessage = threadBatchMessages.last();
            allBatchMessages = allBatchMessages.concat(threadBatchMessages); // Add the thread messages to this message batch to be included in later processing
            if (!lastThreadMessage?.id || threadBatchMessages.size < PAGE_SIZE) {
              keepGoingThread = false;
            } else {
              oldestThreadMessageID = lastThreadMessage.id;
            }
          }
        }
      }

      allBatchMessages = allBatchMessages.concat(channelBatchMessages);

      // Filter and data map messages to be ready for addition to the corpus
      const humanAuthoredMessages = allBatchMessages
        .filter((m) => isHumanAuthoredMessage(m))
        .map(messageToData);
      L.trace({ oldestMessageID }, `Saving ${humanAuthoredMessages.length} messages`);
      // eslint-disable-next-line no-await-in-loop
      await markov.addData(humanAuthoredMessages);
      L.trace('Finished saving messages');
      messagesCount += humanAuthoredMessages.length;
      const lastMessage = channelBatchMessages.last();

      //QQ Message Limit
      if(messagesCount > MESSAGE_LIMIT)
        keepGoing = false;

      // Update tracking metrics
      if (!lastMessage?.id || channelBatchMessages.size < PAGE_SIZE) {
        keepGoing = false;
        const channelIdListItem = ` • <#${channel.id}>`;
        if (completedChannelsField.value === NO_COMPLETED_CHANNELS_TEXT)
          completedChannelsField.value = channelIdListItem;
        else {
          completedChannelsField.value += `\n${channelIdListItem}`;
        }
      } else {
        oldestMessageID = lastMessage.id;
      }
      currentChannelField.value = `<#${channel.id}>`;
      if (!firstMessageDate) firstMessageDate = channelBatchMessages.first()?.createdTimestamp;
      const oldestMessageDate = lastMessage?.createdTimestamp;
      if (firstMessageDate && oldestMessageDate) {
        const channelAge = firstMessageDate - channelCreateDate;
        const lastMessageAge = firstMessageDate - oldestMessageDate;
        const pctComplete = lastMessageAge / channelAge;
        currentChannelPercent.value = `${(pctComplete * 100).toFixed(2)}%`;
        channelEta.report(pctComplete);
        const estimateSeconds = channelEta.estimate();
        if (Number.isFinite(estimateSeconds))
          currentChannelEta.value = formatDistanceToNow(addSeconds(new Date(), estimateSeconds), {
            includeSeconds: true,
          });
      }

      if (messagesCount > lastUpdate + UPDATE_RATE) {
        lastUpdate = messagesCount;
        L.debug(
          { messagesCount, pctComplete: currentChannelPercent.value },
          'Sending metrics update'
        );
        // eslint-disable-next-line no-await-in-loop
        await progressMessage.edit({
          ...updateMessageData,
          embeds: [new Discord.MessageEmbed(embedOptions)],
        });
      }
    }
  }

  L.info({ channelIds }, `Trained from ${messagesCount} past human authored messages.`);
  return `Trained from ${messagesCount} past human authored messages.`;
}

interface GenerateResponse {
  message?: Discord.MessageOptions;
  debug?: Discord.MessageOptions;
  error?: Discord.MessageOptions;
}

interface GenerateOptions {
  tts?: boolean;
  debug?: boolean;
  startSeed?: string;
}

/**
 * General Markov-chain response function
 * @param interaction The message that invoked the action, used for channel info.
 * @param debug Sends debug info as a message if true.
 * @param tts If the message should be sent as TTS. Defaults to the TTS setting of the
 * invoking message.
 */
async function generateResponse(
  interaction: Discord.Message | Discord.CommandInteraction,
  options?: GenerateOptions
): Promise<GenerateResponse> {
  L.debug({ options }, 'Responding...');
  const { tts = false, debug = false, startSeed } = options || {};
  if (!interaction.guildId) {
    L.warn('Received an interaction without a guildId');
    return { error: { content: INVALID_GUILD_MESSAGE } };
  }
  if (!isAllowedUser(interaction.member)) {
    L.info('Member does not have permissions to generate a response');
    return { error: { content: INVALID_PERMISSIONS_MESSAGE } };
  }
  const markov = await getMarkovByGuildId(interaction.guildId);

  try {
    markovGenerateOptions.startSeed = startSeed;
    const response = await markov.generate<MarkovDataCustom>(markovGenerateOptions);
    L.info({ string: response.string }, 'Generated response text');
    L.debug({ response }, 'Generated response object');
    
    CountSinceOutput = 0; //QQ Reset post counter

    const messageOpts: Discord.MessageOptions = {
      tts,
      allowedMentions: { repliedUser: false, parse: [] },
    };
    const attachmentUrls = response.refs
      .filter((ref) => ref.custom && 'attachments' in ref.custom)
      .flatMap((ref) => (ref.custom as MarkovDataCustom).attachments);
    if (attachmentUrls.length > 0) {
      const randomRefAttachment = getRandomElement(attachmentUrls);
      messageOpts.files = [randomRefAttachment];
    } else {
      const randomMessage = await MarkovInputData.createQueryBuilder<
        MarkovInputData<MarkovDataCustom>
      >('input')
        .leftJoinAndSelect('input.markov', 'markov')
        .where({ markov: markov.db })
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();
      const randomMessageAttachmentUrls = randomMessage?.custom?.attachments;
      if (randomMessageAttachmentUrls?.length) {
        messageOpts.files = [{ attachment: getRandomElement(randomMessageAttachmentUrls) }];
      }
    }
    messageOpts.content = response.string;

    const responseMessages: GenerateResponse = {
      message: messageOpts,
    };
    if (debug) {
      responseMessages.debug = {
        content: `\`\`\`\n${JSON.stringify(response, null, 2)}\n\`\`\``,
        allowedMentions: { repliedUser: false, parse: [] },
      };
    }
    return responseMessages;
  } catch (err) {
    L.error(err);
    return {
      error: {
        content: `\n\`\`\`\nERROR: ${err}\n\`\`\``,
        allowedMentions: { repliedUser: false, parse: [] },
      },
    };
  }
}

async function listValidChannels(interaction: Discord.CommandInteraction): Promise<string> {
  if (!interaction.guildId || !interaction.guild) return INVALID_GUILD_MESSAGE;
  const channels = await getValidChannels(interaction.guild);
  const channelText = channels.reduce((list, channel) => {
    return `${list}\n • <#${channel.id}>`;
  }, '');
  return `This bot is currently listening and learning from ${channels.length} channel(s).${channelText}`;
}

function getChannelsFromInteraction(
  interaction: Discord.CommandInteraction
): Discord.TextChannel[] {
  const channels = Array.from(Array(CHANNEL_OPTIONS_MAX).keys()).map((index) =>
    interaction.options.getChannel(`channel-${index + 1}`, index === 0)
  );
  const textChannels = channels.filter(
    (c): c is Discord.TextChannel => c !== null && c instanceof Discord.TextChannel
  );
  return textChannels;
}

function helpMessage(): Discord.MessageOptions {
  const avatarURL = client.user.avatarURL() || undefined;
  const embed = new Discord.MessageEmbed()
    .setAuthor(client.user.username || packageJson().name, avatarURL)
    .setThumbnail(avatarURL as string)
    .setDescription(
      `A Markov chain chatbot that speaks based on learned messages from previous chat input.`
    )
    .addField(
      `${config.messageCommandPrefix} or /${messageCommand.name}`,
      `Generates a sentence to say based on the chat database. Send your message as TTS to recieve it as TTS.`
    )
    .addField(
      `/${listenChannelCommand.name}`,
      `Add, remove, list, or modify the list of channels the bot listens to.`
    )
    .addField(
      `${config.messageCommandPrefix} train or /${trainCommand.name}`,
      `Fetches the maximum amount of previous messages in the listened to text channels. This takes some time.`
    )
    .addField(
      `${config.messageCommandPrefix} invite or /${inviteCommand.name}`,
      `Post this bot's invite URL.`
    )
    .addField(
      `${config.messageCommandPrefix} debug or /${messageCommand.name} debug: True`,
      `Runs the ${config.messageCommandPrefix} command and follows it up with debug info.`
    )
    .addField(
      `${config.messageCommandPrefix} tts or /${messageCommand.name} tts: True`,
      `Runs the ${config.messageCommandPrefix} command and reads it with text-to-speech.`
    )
    .setFooter(
      `${packageJson().name} ${getVersion()} by ${(packageJson().author as PackageJsonPerson).name}`
    );
  return {
    embeds: [embed],
  };
}

function generateInviteUrl(): string {
  return client.generateInvite({
    scopes: ['bot', 'applications.commands'],
    permissions: [
      'VIEW_CHANNEL',
      'SEND_MESSAGES',
      'SEND_TTS_MESSAGES',
      'ATTACH_FILES',
      'READ_MESSAGE_HISTORY',
    ],
  });
}

function ps2Message(): Discord.MessageOptions 
{
  const ps2_index = Math.floor(Math.random() * ps2_list.length);
  const ps2Name = ps2_list[ps2_index];
  const ps2NameScore = ps2_score_list[ps2_index];
  const embed = new Discord.MessageEmbed()
    .addField(`${ps2Name}`, `Rating: ${ps2NameScore}`);
  return { embeds: [embed] };
}

function inviteMessage(): Discord.MessageOptions {
  const avatarURL = client.user.avatarURL() || undefined;
  const inviteUrl = generateInviteUrl();
  const embed = new Discord.MessageEmbed()
    .setAuthor(`Invite ${client.user?.username}`, avatarURL)
    .setThumbnail(avatarURL as string)
    .addField('Invite', `[Invite ${client.user.username} to your server](${inviteUrl})`);
  return { embeds: [embed] };
}

async function handleResponseMessage(
  generatedResponse: GenerateResponse,
  message: Discord.Message
): Promise<void> {
  if (generatedResponse.message) await message.reply(generatedResponse.message);
  if (generatedResponse.debug) await message.reply(generatedResponse.debug);
  if (generatedResponse.error) await message.reply(generatedResponse.error);
}

async function handleUnprivileged(
  interaction: Discord.CommandInteraction | Discord.SelectMenuInteraction,
  deleteReply = true
): Promise<void> {
  if (deleteReply) await interaction.deleteReply();
  await interaction.followUp({ content: INVALID_PERMISSIONS_MESSAGE, ephemeral: true });
}

async function handleNoGuild(
  interaction: Discord.CommandInteraction | Discord.SelectMenuInteraction,
  deleteReply = true
): Promise<void> {
  if (deleteReply) await interaction.deleteReply();
  await interaction.followUp({ content: INVALID_GUILD_MESSAGE, ephemeral: true });
}

client.on('ready', async (readyClient) => {
  L.info({ inviteUrl: generateInviteUrl() }, 'Bot logged in');

  await deployCommands(readyClient.user.id);

  const guildsToSave = readyClient.guilds.valueOf().map((guild) => Guild.create({ id: guild.id }));

  // Remove the duplicate commands
  if (!config.devGuildId) {
    await Promise.all(readyClient.guilds.valueOf().map(async (guild) => guild.commands.set([])));
  }
  await Guild.upsert(guildsToSave, ['id']);
});

client.on('guildCreate', async (guild) => {
  L.info({ guildId: guild.id }, 'Adding new guild');
  await Guild.upsert(Guild.create({ id: guild.id }), ['id']);
});

client.on('debug', (m) => L.trace(m));
client.on('warn', (m) => L.warn(m));
client.on('error', (m) => L.error(m));

client.on('messageCreate', async (message) => {
  if (
    !(
      message.guild &&
      (message.channel instanceof Discord.TextChannel ||
        message.channel instanceof Discord.ThreadChannel)
    )
  )
    return;
  const command = validateMessage(message);
  if (command !== null) L.info({ command }, 'Recieved message command');
  if (command === 'help') {
    await message.channel.send(helpMessage());
  }
  if (command === 'invite') {
    await message.channel.send(inviteMessage());
  }
  if (command === 'train') {
    const response = await saveGuildMessageHistory(message);
    await message.reply(response);
  }
  if (command === 'respond') {
    L.debug('Responding to legacy command');
    const generatedResponse = await generateResponse(message);
    await handleResponseMessage(generatedResponse, message);
  }
  if (command === 'tts') {
    L.debug('Responding to legacy command tts');
    const generatedResponse = await generateResponse(message, { tts: true });
    await handleResponseMessage(generatedResponse, message);
  }
  if (command === 'debug') {
    L.debug('Responding to legacy command debug');
    const generatedResponse = await generateResponse(message, { debug: true });
    await handleResponseMessage(generatedResponse, message);
  }
  if (command === null) {
    if (isHumanAuthoredMessage(message)) {
      if (client.user && message.mentions.has(client.user)) {
        L.debug('Responding to mention');
        // <@!278354154563567636> how are you doing?
        const startSeed = message.content.replace(/<@!\d+>/g, '').trim();
        const generatedResponse = await generateResponse(message, { startSeed });
        await handleResponseMessage(generatedResponse, message);
      }

      if (await isValidChannel(message.channel)) {
        L.debug('Listening');
        const markov = await getMarkovByGuildId(message.channel.guildId);
        await markov.addData([messageToData(message)]);

        //QQ addition (Random Post Generator)
        if(isFinite((CountSinceOutput / RANDOM_MESSAGE_TARGET)))
        {
          let RandomChance = Math.random();
          L.debug('Random Chance Try');
          L.debug(CountSinceOutput.toString());
          L.debug(RandomChance.toString());
          L.debug(((CountSinceOutput / RANDOM_MESSAGE_TARGET) * RANDOM_MESSAGE_CHANCE).toString() );
          if (RandomChance < ((CountSinceOutput / RANDOM_MESSAGE_TARGET) * RANDOM_MESSAGE_CHANCE )) 
          {
            L.debug('Random Chance Pass');
            const generatedResponse = await generateResponse(message);
            await handleResponseMessage(generatedResponse, message);
          }
        }
        CountSinceOutput++;

        //QQ addition (PS2)
        if(message.content.toLowerCase().includes("ps2"))
        {
          message.channel.send(ps2Message())
        }
      }
    }
  }
});

client.on('messageDelete', async (message) => {
  if (!isHumanAuthoredMessage(message)) return;
  if (!(await isValidChannel(message.channel))) return;
  if (!message.guildId) return;

  L.debug(`Deleting message ${message.id}`);
  const markov = await getMarkovByGuildId(message.guildId);
  await markov.removeTags([message.id]);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!isHumanAuthoredMessage(oldMessage)) return;
  if (!(await isValidChannel(oldMessage.channel))) return;
  if (!(oldMessage.guildId && newMessage.content)) return;

  L.debug(`Editing message ${oldMessage.id}`);
  const markov = await getMarkovByGuildId(oldMessage.guildId);
  await markov.removeTags([oldMessage.id]);
  await markov.addData([newMessage.content]);
});

client.on('threadDelete', async (thread) => {
  if (!(await isValidChannel(thread))) return;
  if (!thread.guildId) return;

  L.debug(`Deleting thread messages ${thread.id}`);
  const markov = await getMarkovByGuildId(thread.guildId);
  await markov.removeTags([thread.id]);
});

// eslint-disable-next-line consistent-return
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    L.info({ command: interaction.commandName }, 'Recieved slash command');

    if (interaction.commandName === helpCommand.name) {
      await interaction.reply(helpMessage());
    } else if (interaction.commandName === inviteCommand.name) {
      await interaction.reply(inviteMessage());
    } else if (interaction.commandName === messageCommand.name) {
      await interaction.deferReply();
      const tts = interaction.options.getBoolean('tts') || false;
      const debug = interaction.options.getBoolean('debug') || false;
      const startSeed = interaction.options.getString('seed')?.trim() || undefined;
      const generatedResponse = await generateResponse(interaction, { tts, debug, startSeed });
      if (generatedResponse.message) await interaction.editReply(generatedResponse.message);
      else await interaction.deleteReply();
      if (generatedResponse.debug) await interaction.followUp(generatedResponse.debug);
      if (generatedResponse.error) {
        await interaction.followUp({ ...generatedResponse.error, ephemeral: true });
      }
    } else if (interaction.commandName === listenChannelCommand.name) {
      await interaction.deferReply();
      const subCommand = interaction.options.getSubcommand(true) as 'add' | 'remove' | 'list';
      if (subCommand === 'list') {
        const reply = await listValidChannels(interaction);
        await interaction.editReply(reply);
      } else if (subCommand === 'add') {
        if (!isModerator(interaction.member)) {
          return handleUnprivileged(interaction);
        }
        if (!interaction.guildId) {
          return handleNoGuild(interaction);
        }
        const channels = getChannelsFromInteraction(interaction);
        await addValidChannels(channels, interaction.guildId);
        await interaction.editReply(
          `Added ${channels.length} text channels to the list. Use \`/train\` to update the past known messages.`
        );
      } else if (subCommand === 'remove') {
        if (!isModerator(interaction.member)) {
          return handleUnprivileged(interaction);
        }
        if (!interaction.guildId) {
          return handleNoGuild(interaction);
        }
        const channels = getChannelsFromInteraction(interaction);
        await removeValidChannels(channels, interaction.guildId);
        await interaction.editReply(
          `Removed ${channels.length} text channels from the list. Use \`/train\` to remove these channels from the past known messages.`
        );
      } else if (subCommand === 'modify') {
        if (!interaction.guild) {
          return handleNoGuild(interaction);
        }
        if (!isModerator(interaction.member)) {
          await handleUnprivileged(interaction);
        }
        await interaction.deleteReply();
        const dbTextChannels = await getTextChannels(interaction.guild);
        const row = new Discord.MessageActionRow().addComponents(
          new Discord.MessageSelectMenu()
            .setCustomId('listen-modify-select')
            .setPlaceholder('Nothing selected')
            .setMinValues(0)
            .setMaxValues(dbTextChannels.length)
            .addOptions(
              dbTextChannels.map((c) => ({
                label: `#${c.name}` || c.id,
                value: c.id,
                default: c.listen || false,
              }))
            )
        );

        await interaction.followUp({
          content: 'Select which channels you would like to the bot to actively listen to',
          components: [row],
          ephemeral: true,
        });
      }
    } else if (interaction.commandName === trainCommand.name) {
      await interaction.deferReply();
      const reply = (await interaction.fetchReply()) as Discord.Message; // Must fetch the reply ASAP
      const responseMessage = await saveGuildMessageHistory(interaction);
      // Send a message in reply to the reply to avoid the 15 minute webhook token timeout
      await reply.reply({ content: responseMessage });
    }
  } else if (interaction.isSelectMenu()) {
    if (interaction.customId === 'listen-modify-select') {
      await interaction.deferUpdate();
      const { guild } = interaction;
      if (!isModerator(interaction.member)) {
        return handleUnprivileged(interaction, false);
      }
      if (!guild) {
        return handleNoGuild(interaction, false);
      }

      const allChannels =
        (interaction.component as APISelectMenuComponent).options?.map((o) => o.value) || [];
      const selectedChannelIds = interaction.values;

      const textChannels = (
        await Promise.all(
          allChannels.map(async (c) => {
            return guild.channels.fetch(c);
          })
        )
      ).filter((c): c is Discord.TextChannel => c !== null && c instanceof Discord.TextChannel);
      const unselectedChannels = textChannels.filter((t) => !selectedChannelIds.includes(t.id));
      const selectedChannels = textChannels.filter((t) => selectedChannelIds.includes(t.id));
      await addValidChannels(selectedChannels, guild.id);
      await removeValidChannels(unselectedChannels, guild.id);

      await interaction.followUp({
        content: 'Updated actively listened to channels list.',
        ephemeral: true,
      });
    }
  }
});

/**
 * Loads the config settings from disk
 */
async function main(): Promise<void> {
  const connection = await Markov.extendConnectionOptions();
  await createConnection(connection);
  await client.login(config.token);
}

main();
