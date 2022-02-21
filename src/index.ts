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

const gamecube_list = ['007 - Agent Under Fire', '007 - Everything or Nothing', '007 - From Russia with Love', '007 - Nightfire', '1080 Avalanche', '18 Wheeler - American Pro Trucker', '2002 FIFA World Cup', '2006 FIFA World Cup', '4x4 Evo 2', 'Adventures of Jimmy Neutron, The - Boy Genius - Attack of the Twonkies', 'Adventures of Jimmy Neutron, The - Boy Genius - Jet Fusion', 'Adventures of Jimmy Neutron, The - Boy Genius', 'Aggressive Inline', 'Alien Hominid', 'All-Star Baseball 2002', 'All-Star Baseball 2003', 'All-Star Baseball 2004', 'Amazing Island', 'American Chopper 2 - Full Throttle', 'Animal Crossing', 'Animaniacs - The Great Edgar Hunt', 'Ant Bully, The', 'Aquaman - Battle for Atlantis', 'Army Men - Air Combat - The Elite Missions', 'Army Men - RTS', 'Army Men - Sarge\\\'s War', 'Asterix & Obelix XXL', 'ATV - Quad Power Racing 2', 'Auto Modellista', 'Avatar - The Last Airbender', 'Backyard Baseball', 'Backyard Baseball 2007', 'Backyard Football', 'Bad Boys - Miami Takedown', 'Baldur\\\'s Gate - Dark Alliance', 'Barnyard', 'Baten Kaitos - Eternal Wings and the Lost Ocean  Disk 1', 'Baten Kaitos - Eternal Wings and the Lost Ocean  Disk 2', 'Baten Kaitos Origins  Disk 1', 'Baten Kaitos Origins  Disk 2', 'Batman - Dark Tomorrow', 'Batman - Rise of Sin Tzu', 'Batman - Vengeance', 'Batman Begins', 'Battalion Wars', 'Battle Stadium D.O.N', 'Beach Spikers - Virtua Beach Volleyball', 'Beyblade VForce - Super Tournament Battle', 'Beyond Good & Evil', 'Big Air Freestyle', 'Big Mutha Truckers', 'Billy Hatcher and the Giant Egg', 'Bionicle', 'Bionicle Heroes', 'Black & Bruised', 'Bleach GC - Tasogare Ni Mamieru Shinigami', 'BloodRayne', 'Bloody Roar - Primal Fury', 'Blowout', 'BMX XXX', 'Boboboubo Boubobo Dassutsu! Hajike Royale', 'Bomber Man Land 2', 'Bomberman Generation', 'Bomberman Jetters', 'Bratz - Forever Diamondz', 'Bratz - Rock Angelz', 'Buffy the Vampire Slayer - Chaos Bleeds', 'Burnout', 'Burnout 2 - Point of Impact', 'Bust-A-Move 3000', 'Butt-Ugly Martians - Zoom or Doom!', 'Cabela\\\'s Big Game Hunter - 2005 Adventures', 'Cabela\\\'s Dangerous Hunts 2', 'Cabela\\\'s Outdoor Adventures', 'Call of Duty - Finest Hour', 'Call of Duty 2 - Big Red One', 'Capcom vs. SNK 2 EO - Millionaire Fighting 2001', 'Captain Tsubasa - Ougon Sedai No Chousen', 'Carmen Sandiego - The Secret of the Stolen Drums', 'Casper - Spirit Dimensions', 'Catwoman', 'Cel Damage', 'Chaos Field', 'Charinko Hero', 'Charlie and the Chocolate Factory', 'Charlie\\\'s Angels', 'Chibi-Robo! - Plug into Adventure', 'Chronicles of Narnia, The - The Lion, the Witch and the Wardrobe', 'City Racer', 'Cocoto Funfair', 'Cocoto Kart Racer', 'Cocoto Platform Jumper', 'Codename - Kids Next Door - Operation - V.I.D.E.O.G.A.M.E.', 'Conan  Disk 1', 'Conan  Disk 2', 'Conflict - Desert Storm', 'Conflict - Desert Storm II - Back to Baghdad', 'Crash Bandicoot - The Wrath of Cortex', 'Crash Nitro Kart', 'Crash Tag Team Racing', 'Crazy Taxi', 'Cubivore', 'Cubix Robots for Everyone - Showdown', 'Curious George', 'Custom Robo', 'Dakar 2 - The World\\\'s Ultimate Rally', 'Dance Dance Revolution - Mario Mix', 'Dark Summit', 'Darkened Skye', 'Dave Mirra Freestyle BMX 2', 'Dead to Rights', 'Def Jam - Fight for NY', 'Def Jam - Vendetta', 'Defender', 'Die Hard - Vendetta', 'Digimon Rumble Arena 2', 'Digimon World 4', 'Dinotopia - The Sunstone Odyssey', 'Disney Sports - Basketball', 'Disney Sports - Football', 'Disney Sports - Skateboarding', 'Disney Sports - Soccer', 'Disney-Pixar Cars', 'Disney-Pixar Finding Nemo', 'Disney-Pixar Monsters, Inc. - Scream Arena', 'Disney-Pixar Ratatouille', 'Disney\\\'s Chicken Little', 'Disney\\\'s Donald Duck - Goin\\\' Quackers', 'Disney\\\'s Extreme Skate Adventure', 'Disney\\\'s Hide & Sneak', 'Disney\\\'s Magical Mirror Starring Mickey Mouse', 'Disney\\\'s Meet the Robinsons', 'Disney\\\'s Party', 'Disney\\\'s PK - Out of the Shadows', 'Disney\\\'s Tarzan Untamed', 'Disney\\\'s The Haunted Mansion', 'Donkey Kong Jungle Beat', 'Donkey Konga', 'Donkey Konga 2', 'Donkey Konga 3', 'Dora the Explorer - Journey to the Purple Planet', 'Doraemon - Minna de Asobou! Miniland', 'Doshin the Giant', 'Dr. Muto', 'Dragon Ball Z - Budokai', 'Dragon Ball Z - Budokai 2', 'Dragon Ball Z - Sagas', 'Dragon Drive - D-Masters Shot', 'Dragon\\\'s Lair 3D - Return to the Lair', 'DreamMix TV - World Fighters', 'Driven', 'Drome Racers', 'Ed, Edd n Eddy - The Mis-Edventures', 'Egg Mania - Eggstreme Madness', 'Enter the Matrix  Disk 1', 'Enter the Matrix  Disk 2', 'ESPN International Winter Sports 2002', 'ESPN MLS ExtraTime 2002', 'Eternal Darkness - Sanity\\\'s Requiem', 'Evolution Skateboarding', 'Evolution Snowboarding', 'Evolution Worlds', 'F-Zero GX', 'F1 2002', 'F1 Career Challenge', 'Fairly OddParents, The - Breakin\\\' da Rules', 'Fairly OddParents, The - Shadow Showdown', 'Fantastic 4', 'FIFA Soccer 06', 'FIFA Soccer 07', 'FIFA Soccer 2002', 'FIFA Soccer 2003', 'FIFA Soccer 2004', 'FIFA Soccer 2005', 'FIFA Street', 'FIFA Street 2', 'Fight Night Round 2', 'Final Fantasy - Crystal Chronicles', 'Fire Emblem - Path of Radiance', 'Fireblade', 'Flushed Away', 'Franklin - A Birthday Surprise', 'Freaky Flyers  Disk 1', 'Freaky Flyers  Disk 2', 'Freedom Fighters', 'Freekstyle', 'Freestyle MetalX', 'Freestyle Street Soccer', 'Frogger - Ancient Shadow', 'Frogger Beyond', 'Frogger\\\'s Adventures - The Rescue', 'Future Tactics - The Uprising', 'Gauntlet - Dark Legacy', 'Geist', 'Gladius', 'Go! Go! Hypergrind', 'Goblin Commander - Unleash the Horde', 'Godzilla - Destroy All Monsters Melee', 'GoldenEye - Rogue Agent  Disk 1', 'GoldenEye - Rogue Agent  Disk 2', 'Gotcha Force', 'Grim Adventures of Billy & Mandy, The', 'Grooverider - Slot Car Thunder', 'GT Cube', 'Gun', 'Happy Feet', 'Harry Potter - Quidditch World Cup', 'Harry Potter and the Chamber of Secrets', 'Harry Potter and the Goblet of Fire', 'Harry Potter and the Prisoner of Azkaban', 'Harry Potter and the Sorcerer\\\'s Stone', 'Harvest Moon - A Wonderful Life', 'Harvest Moon - Another Wonderful Life', 'Harvest Moon - Magical Melody', 'Hello Kitty - Roller Rescue', 'Hitman 2 - Silent Assassin', 'Hobbit, The', 'Home Run King', 'Hot Wheels - Velocity X', 'Hot Wheels - World Race', 'Hudson Selection Vol.1 - Cubic Lode Runner', 'Hudson Selection Vol.2 - Star Soldier', 'Hudson Selection Vol.3 - PC Genjin - Pithecanthropus Computerurus', 'Hudson Selection Vol.4 - Takahashi-Meijin no Boukenjima', 'Hulk', 'Hunter - The Reckoning', 'I-Ninja', 'Ice Age 2 - The Meltdown', 'Ikaruga', 'Incredible Hulk, The - Ultimate Destruction', 'Incredibles, The - Rise of the Underminer', 'Incredibles, The', 'Intellivision Lives!', 'International Superstar Soccer 2', 'International Superstar Soccer 3', 'Italian Job, The', 'Jeremy McGrath Supercross World', 'Jikkyou World Soccer 2002', 'Judge Dredd - Dredd vs Death', 'Kao the Kangaroo - Round 2', 'Karaoke Revolution Party', 'Kelly Slater\\\'s Pro Surfer', 'Kidou Senshi Gundam - Gundam vs. Z Gundam', 'Killer7  Disk 1', 'Killer7  Disk 2', 'King Arthur', 'Kirby Air Ride', 'Knights of the Temple - Infernal Crusade', 'Knockout Kings 2003', 'Konjiki no Gashbell!! Go! Go! Mamono Fight!!', 'Konjiki no Gashbell!! Yuujyo Tag Battle - Full Power', 'Konjiki no Gashbell!! Yuujyo Tag Battle 2', 'Korokke! Ban-Ou no Kiki o Sukue', 'Kururin Squash!', 'Lara Croft Tomb Raider - Legend', 'Largo Winch - Empire Under Threat', 'Legacy of Kain, The - Blood Omen 2', 'Legend of Spyro, The - A New Beginning', 'Legend of Zelda, The - Collector\\\'s Edition', 'Legend of Zelda, The - Four Swords Adventures', 'Legend of Zelda, The - Ocarina of Time - Master Quest', 'Legend of Zelda, The - The Wind Waker', 'Legend of Zelda, The - Twilight Princess', 'Legends of Wrestling', 'Legends of Wrestling II', 'LEGO Star Wars - The Video Game', 'LEGO Star Wars II - The Original Trilogy', 'Lemony Snicket\\\'s A Series of Unfortunate Events', 'Looney Tunes - Back in Action', 'Lord of the Rings, The - The Return of the King', 'Lord of the Rings, The - The Third Age  Disk 1', 'Lord of the Rings, The - The Third Age  Disk 2', 'Lord of the Rings, The - The Two Towers', 'Lost Kingdoms', 'Lost Kingdoms II', 'Lotus Challenge', 'Luigi\\\'s Mansion', 'Madagascar', 'Madden NFL 06', 'Madden NFL 07', 'Madden NFL 08', 'Madden NFL 2002', 'Madden NFL 2003', 'Madden NFL 2004', 'Madden NFL 2005', 'Major League Baseball 2K6', 'Mario Golf - Toadstool Tour', 'Mario Kart - Double Dash!!', 'Mario Party 4', 'Mario Party 5', 'Mario Party 6', 'Mario Party 7', 'Mario Power Tennis', 'Mario Superstar Baseball', 'Mark Davis Pro Bass Challenge', 'Marvel Nemesis - Rise of the Imperfects', 'Mary-Kate and Ashley - Sweet 16 - Licensed to Drive', 'Mat Hoffman\\\'s Pro BMX 2', 'Maxplay Classic Games Volume 1', 'MC Groovz Dance Craze', 'Medabots Infinity', 'Medal of Honor - European Assault', 'Medal of Honor - Frontline', 'Medal of Honor - Rising Sun  Disk 1', 'Medal of Honor - Rising Sun  Disk 2', 'Mega Man - Network Transmission', 'Mega Man Anniversary Collection', 
'Mega Man X - Command Mission', 'Mega Man X Collection', 'Men in Black II - Alien Escape', 'Metal Arms - Glitch in the System', 'Metal Gear Solid - The Twin Snakes  Disk 1', 'Metal Gear Solid - The Twin Snakes  Disk 2', 'Metroid Prime', 'Metroid Prime 2 - Echoes', 'Micro Machines', 'Midway Arcade Treasures', 'Midway Arcade Treasures 2', 'Midway Arcade Treasures 3', 'Minority Report - Everybody Runs', 'Mission Impossible - Operation Surma', 'MLB SlugFest 2003', 'MLB SlugFest 2004', 'Monopoly Party', 'Monster 4x4 - Masters of Metal', 'Monster House', 'Monster Jam - Maximum Destruction', 'Mortal Kombat - Deadly Alliance', 'Mortal Kombat - Deception', 'Mr. Driller - Drill Land', 'Muppets - Party Cruise', 'MVP Baseball 2004', 'MVP Baseball 2005', 'MX Superfly Featuring Ricky Carmichael', 'Mystic Heroes', 'Namco Museum - 50th Anniversary', 'Namco Museum', 'Naruto - Clash of Ninja', 'Naruto - Clash of Ninja 2', 'Naruto - Gekitou Ninja Taisen! 3', 'Naruto - Gekitou Ninja Taisen! 4', 'NASCAR - Dirt to Daytona', 'NASCAR 2005 - Chase for the Cup', 'NASCAR Thunder 2003', 'NBA 2K2', 'NBA 2K3', 'NBA Courtside 2002', 'NBA Live 06', 'NBA Live 2003', 'NBA Live 2004', 'NBA Live 2005', 'NBA Street', 'NBA Street V3', 'NBA Street Vol. 2', 'NCAA College Basketball 2K3', 'NCAA College Football 2K3', 'NCAA Football 2003', 'NCAA Football 2004', 'NCAA Football 2005', 'Need for Speed - Carbon', 'Need for Speed - Hot Pursuit 2', 'Need for Speed - Most Wanted', 'Need for Speed - Underground', 'Need for Speed - Underground 2', 'Neighbours From Hell', 'NFL 2K3', 'NFL Blitz 2002', 'NFL Blitz 2003', 'NFL Blitz Pro', 'NFL Quarterback Club 2002', 'NFL Street', 'NFL Street 2', 'NHL 06', 'NHL 2003', 'NHL 2004', 'NHL 2005', 'NHL 2K3', 'NHL Hitz 2002', 'NHL Hitz 2003', 'NHL Hitz Pro', 'Nickelodeon Party Blast', 'Nicktoons - Battle for Volcano Island', 'Nicktoons Unite!', 'Nintendo Puzzle Collection', 'Odama', 'One Piece - Grand Adventure', 'One Piece - Grand Battle', 'One Piece - Grand Battle 3', 'One Piece - Pirates Carnival', 'One Piece - Treasure Battle!', 'Open Season', 'Outlaw Golf', 'Over the Hedge', 'P.N. 03', 'Pac-Man Fever', 'Pac-Man Vs.', 'Pac-Man World 2', 'Pac-Man World 3', 'Pac-Man World Rally', 'Paper Mario - The Thousand-Year Door', 'Peter Jackson\\\'s King Kong', 'Phantasy Star Online Episode I & II', 'Phantasy Star Online Episode I & II Plus', 'Phantasy Star Online Episode III - C.A.R.D. Revolution', 'Piglet\\\'s Big Game', 'Pikmin', 'Pikmin 2', 'Pinball Hall of Fame - The Gottlieb Collection', 'Pitfall - The Lost Expedition', 'Pokemon Box - Ruby & Sapphire', 'Pokemon Channel', 'Pokemon Colosseum', 'Pokemon XD - Gale of Darkness', 'Polar Express, The', 'Pool Edge', 'Pool Paradise', 'Power Rangers - Dino Thunder', 'Powerpuff Girls, The - Relish Rampage', 'Prince of Persia - The Sands of Time', 'Prince of Persia - The Two Thrones', 'Prince of Persia - Warrior Within', 'Pro Rally', 'Puyo Pop Fever', 'R - Racing Evolution', 'Radirgy Generic', 'Rally Championship', 'Rampage - Total Destruction', 'Rave Master', 'Rayman 3 - Hoodlum Havoc', 'Rayman Arena', 'Red Faction II', 'RedCard 2003', 'Rei Fighter Gekitsui Senki', 'Reign of Fire', 'Resident Evil - Code - Veronica X  Disk 1', 'Resident Evil - Code - Veronica X  Disk 2', 'Resident Evil  Disk 1', 'Resident Evil  Disk 2', 'Resident Evil 2', 'Resident Evil 3 - Nemesis', 'Resident Evil 4  Disk 1', 'Resident Evil 4  Disk 2', 'Resident Evil Zero  Disk 1', 'Resident Evil Zero  Disk 2', 'Ribbit King  Disk 1', 'Ribbit King  Disk 2', 'Road Trip - The Arcade Edition', 'RoadKill', 'Robocop - Aratanaru Kiki', 'Robotech - Battlecry', 'Robots', 'Rocket Power - Beach Bandits', 'Rocky', 'Rogue Ops', 'Rugrats - Royal Ransom', 'Samurai Jack - The Shadow of Aku', 'Scaler', 'Scooby-Doo! - Mystery Mayhem', 'Scooby-Doo! - Night of 100 Frights', 'Scooby-Doo! - Unmasked', 'Scorpion King, The - Rise of the Akkadian', 'SeaWorld Adventure Parks - Shamu\\\'s Deep Sea Adventures', 'Second Sight', 'Sega Soccer Slam', 'Serious Sam - Next Encounter', 'Shadow the Hedgehog', 'Shaman King - Soul Fight', 'Shark Tale', 'Shikigami no Shiro II', 'Shinseiki GPX Cyber Formula - Road to the Evolution', 'Shrek - Extra Large', 'Shrek 2', 'Shrek Smash n\\\' Crash Racing', 'Shrek Super Party', 'Shrek SuperSlam', 'Simpsons, The - Hit & Run', 'Simpsons, The - Road Rage', 'Sims 2, The - Pets', 'Sims 2, The', 'Sims, The - Bustin\\\' Out', 'Sims, The', 'Skies of Arcadia Legends', 'Smashing Drive', 'Smuggler\\\'s Run - Warzones', 'Sonic Adventure 2 - Battle', 'Sonic Adventure DX - Director\\\'s Cut', 'Sonic Gems Collection', 'Sonic Heroes', 'Sonic Mega Collection', 'Sonic Riders', 'Soul Calibur II', 'Space Raiders', 'Spartan - Total Warrior', 'Spawn - Armageddon', 'Speed Challenge - Jacques Villeneuve\\\'s Racing Vision', 'Speed Kings', 'Sphinx and the Cursed Mummy', 'Spider-Man', 'Spider-Man 2', 'Spirits & Spells', 'SpongeBob SquarePants - Battle for Bikini Bottom', 'SpongeBob SquarePants - Creature from the Krusty Krab', 'SpongeBob SquarePants - Lights, Camera, Pants!', 'SpongeBob SquarePants - Revenge of the Flying Dutchman', 'SpongeBob SquarePants - The Movie', 'Spy Hunter', 'Spyro - A Hero\\\'s Tail', 'Spyro - Enter the Dragonfly', 'SSX 3', 'SSX On Tour', 'SSX Tricky', 'Star Fox Adventures', 'Star Fox Assault', 'Star Wars - Bounty Hunter', 'Star Wars - Jedi Knight II - Jedi Outcast', 'Star Wars - Rogue Squadron II - Rogue Leader', 'Star Wars - Rogue Squadron III - Rebel Strike', 'Star Wars - The Clone Wars', 'Starsky & Hutch', 'Street Hoops', 'Street Racing Syndicate', 'Strike Force Bowling', 'Sum of All Fears, The', 'Summoner - A Goddess Reborn', 'Super Bubble Pop', 'Super Mario Strikers', 'Super Mario Sunshine', 'Super Monkey Ball', 'Super Monkey Ball 2', 'Super Monkey Ball Adventure', 'Super Smash Bros. Melee', 'Superman - Shadow of Apokolips', 'Surf\\\'s Up', 'Swingerz Golf', 'SX Superstar', 'Tak - The Great Juju Challenge', 'Tak 2 - The Staff of Dreams', 'Tak and the Power of Juju', 'Tales of Symphonia  Disk 1', 'Tales of Symphonia  Disk 2', 'Taxi 3', 'Taz - Wanted', 'Teen Titans', 'Teenage Mutant Ninja Turtles', 'Teenage Mutant Ninja Turtles 2 - Battle Nexus  Disk 1', 'Teenage Mutant Ninja Turtles 2 - Battle Nexus  Disk 2', 'Teenage Mutant Ninja Turtles 3 - Mutant Nightmare  Disk 1', 'Teenage Mutant Ninja Turtles 3 - Mutant Nightmare  Disk 2', 'Terminator 3 - The Redemption', 'Tetris Worlds', 'Tiger Woods PGA Tour 06', 'Tiger Woods PGA Tour 2003', 'Tiger Woods PGA Tour 2004  Disk 1', 'Tiger Woods PGA Tour 2004  Disk 2', 'Tiger Woods PGA Tour 2005  Disk 1', 'Tiger Woods PGA Tour 2005  Disk 2', 'TimeSplitters - Future Perfect', 'TimeSplitters 2', 'TMNT - Mutant Melee', 'TMNT', 'Tom & Jerry in War of the Whiskers', 'Tom Clancy\\\'s Ghost Recon', 'Tom Clancy\\\'s Ghost Recon 2', 'Tom Clancy\\\'s Rainbow Six - Lockdown', 'Tom Clancy\\\'s Rainbow Six 3', 'Tom Clancy\\\'s Splinter Cell - Chaos Theory  Disk 1', 'Tom Clancy\\\'s Splinter Cell - Chaos Theory  Disk 2', 'Tom Clancy\\\'s Splinter Cell - Double Agent  Disk 1', 'Tom Clancy\\\'s Splinter Cell - Double Agent  Disk 2', 'Tom Clancy\\\'s Splinter Cell - Pandora Tomorrow', 'Tom Clancy\\\'s Splinter Cell', 'Tonka - Rescue Patrol', 'Tony Hawk\\\'s American Wasteland', 'Tony Hawk\\\'s Pro Skater 3', 'Tony Hawk\\\'s Pro Skater 4', 'Tony Hawk\\\'s Underground', 'Tony Hawk\\\'s Underground 2', 'Top Angler - Real Bass Fishing', 'Top Gun - Combat Zones', 'Tower of Druaga, The', 'TransWorld Surf - Next Wave', 'Trigger Man', 'True Crime - New York City', 'True Crime - Streets of LA', 'Tube Slider - The Championship of Future Formula', 'Turok - Evolution', 'Ty the Tasmanian Tiger', 'Ty the Tasmanian Tiger 2 - Bush Rescue', 'Ty the Tasmanian Tiger 3 - Night of the Quinkan', 'UEFA Champions League 2004-2005', 'UFC - Throwdown', 'Ultimate Muscle - Legends vs. New Generation', 'Ultimate Spider-Man', 'Universal Studios Theme Parks Adventure', 'Urbz, The - Sims in the City', 'V-Rally 3', 'Vexx', 'Viewtiful Joe - Red Hot Rumble', 'Viewtiful Joe', 'Viewtiful Joe 2', 'Virtua Quest', 'Virtua Striker 2002', 'Wallace & Gromit in Project Zoo', 'Wario World', 'WarioWare, Inc. - Mega Party Game$!', 'Warrior Blade - Rastan vs. Barbarian', 'Wave Race - Blue Storm', 'Whirl Tour', 'Winnie the Pooh\\\'s Rumbly Tumbly Adventure', 'World Racing', 'World Series of Poker', 'World Soccer Winning Eleven 6 - Final Evolution', 'Worms 3D', 'Worms Blast', 'Wreckless - The Yakuza Missions', 'WTA Tour Tennis', 'WWE Crush Hour', 'WWE Day of Reckoning', 'WWE Day of Reckoning 2', 'WWE Wrestlemania X8', 'WWE Wrestlemania XIX', 'X-Men - Next Dimension', 'X-Men - The Official Game', 'X-Men Legends', 'X-Men Legends II - Rise of Apocalypse', 'X2 - Wolverine\\\'s Revenge', 'XGIII - Extreme G Racing', 'XGRA - Extreme G Racing Association', 'XIII', 'Yu-Gi-Oh! - The Falsebound Kingdom', 'Zapper - One Wicked Cricket!', 'Zatch Bell! - Mamodo Battles', 'Zatch Bell! - Mamodo Fury', 'Zoids - Battle Legends', 'Zoids - Full Metal Crash', 'Zoids Vs.', 'Zoids Vs. III', 'ZooCube'];

const gamecube_score_list = [3.8, 3.8, 3.7, 3.5, 3.7, 3.4, 2.8, 3.6, 2.2, 3.2, 3.5, 3, 3.5, 2.3, 2.9, 3.6, 3, 3.9, 3.1, 3.8, 4.2, 2.7, 1.2, 4.2, 3.9, 3.3, 4.3, 3.9, 3.3, 3.2, 3.6, 3.8, 3.5, 2.7, 3.5, 3.3, 3.6, 3.6, 2.9, 2.9, 1.4, 2.2, 3.2, 3.7, 3.4, 3.5, 3.7, 2.2, 4.4, 2.3, 2.6, 3.8, 4, 4.5, 3.4, 3.5, 3.8, 3.3, 3.1, 2.5, 4, 3.9, 3.6, 3.4, 3, 3.4, 3.9, 3.5, 3.7, 3.6, 3.3, 4.1, 3.4, 3.4, 3.6, 3.8, 3.2, 2.9, 3.2, 4, 2.4, 3.4, 4, 3.9, 3.2, 2.5, 3.9, 2.8, 3.3, 3.6, 2.5, 2.9, 3, 2.9, 2.9, 3.4, 3.7, 3.4, 4, 4.1, 3.7, 3.6, 4, 3.6, 3.1, 3.3, 4.3, 3.6, 3.6, 3.8, 3.5, 3.8, 3, 3.6, 3.2, 3.5, 3.7, 3.2, 3.8, 3.9, 3.7, 4, 3.4, 3.4, 3.1, 3.4, 3.8, 3.2, 3.9, 3.8, 2.7, 3.7, 3.7, 3.1, 3.4, 4.2, 3.6, 3.7, 3.7, 4.2, 2.7, 4.1, 3.6, 3.3, 3.7, 3.6, 2.8, 3.2, 4.1, 4, 3.5, 2.7, 3.4, 3.2, 3.1, 3.1, 2.6, 3.9, 3.9, 4, 3.7, 3.3, 4.2, 3.5, 4, 3.1, 3, 4.1, 3.7, 3.8, 4.1, 4.3, 4, 3.8, 3.1, 4, 4.3, 3.8, 4, 3.7, 3.1, 3.3, 3.6, 3.6, 4.2, 3.7, 3.7, 2.6, 2.7, 2.6, 3.3, 3.7, 3.7, 3.9, 3.4, 3.8, 4.1, 3.7, 3.2, 3.2, 3.6, 3.5, 3.2, 3.7, 3.9, 2.5, 2.8, 3.1, 3, 3.3, 3.6, 3.5, 3.6, 4.3, 3.3, 4, 3.2, 3.5, 3.5, 2.9, 3.6, 4.1, 4, 3.7, 3.3, 3.6, 3.4, 3.6, 4.4, 4.1, 3.5, 3.7, 3.1, 3.7, 4, 3.2, 2.8, 3.8, 3.3, 3.4, 3.9, 3.1, 3.7, 4.3, 4.3, 3.5, 3.5, 3.3, 3.8, 2.9, 3.7, 3.3, 4.1, 3.6, 4.3, 3.5, 4.5, 3.4, 4.2, 4.1, 3.8, 4.6, 4.1, 2.8, 3, 4.1, 3.9, 3.4, 4, 3.8, 3.5, 3.5, 3.8, 3.4, 3.8, 3.7, 3.8, 3.6, 3.8, 4.1, 3.8, 4.4, 4.1, 4.1, 4.2, 3.7, 3.8, 4.4, 3.5, 3.6, 3.7, 3.6, 3.8, 3.7, 3.7, 3.9, 2.3, 3.2, 3.5, 2.5, 3.4, 3.7, 4, 3.6, 3.6, 3.6, 3.8, 3.5, 4.4, 3.5, 4.2, 3.9, 3.9, 4.1, 4.1, 3.7, 3.6, 3.9, 3.7, 2.5, 3.7, 4.4, 4, 4, 3.5, 2.6, 3.8, 3.4, 4, 3, 3.1, 3.7, 4.2, 4.1, 3.4, 3.8, 3.8, 3.3, 3.4, 4, 4.2, 4.5, 4.2, 4.4, 3.9, 4.3, 3.7, 3.9, 3.6, 4.2, 4.2, 4.3, 4.5, 4.3, 4.1, 3.8, 4.6, 4.4, 4.3, 3.7, 3.6, 4.1, 4.1, 3.9, 3.1, 3.6, 3.7, 3.7, 3.5, 3.4, 4, 4.2, 3.9, 4.1, 4.2, 4.1, 3.9, 3.9, 4, 4.7, 2.7, 3.3, 3, 4.1, 3.5, 3.7, 4.1, 3.7, 4, 3.7, 4, 3, 3.2, 3.4, 3.8, 4.1, 3.9, 4.3, 3.9, 4.1, 4.3, 4.1, 4.1, 4.4, 3.2, 3.9, 4, 4.2, 3.8, 3.7, 3.3, 3.7, 3.8, 1.8, 4.1, 3.5, 2.8, 3, 3.9, 4, 3.5, 3.1, 3.9, 3.7, 4, 2.9, 2.7, 2.9, 4.3, 3.3, 4.1, 3.7, 3.7, 3.4, 4.5, 4.5, 4.2, 4.2, 3.9, 4.2, 4.1, 4.1, 3.9, 3.9, 4, 4, 3.5, 3.8, 3.6, 3.8, 3.1, 3.6, 3.9, 3.1, 3, 3.9, 3.8, 3, 3.6, 3.3, 2.9, 4, 3.8, 4.1, 3.2, 3.7, 3.9, 3.6, 3.7, 4.2, 3.2, 4, 4.2, 3.8, 3.5, 3.9, 3.6, 4, 3.7, 4.2, 4, 3.7, 2.3, 3.7, 4, 4, 4.4, 3.4, 3.9, 4, 4.5, 3.2, 3.7, 3.8, 4.2, 3.7, 3.5, 3.9, 4, 2.6, 3.6, 3.2, 2.9, 3.9, 4.2, 3.7, 3.4, 2.8, 3.9, 4.2, 3.9, 3.7, 3.4, 4, 3.8, 3.9, 3.9, 4, 3.9, 3.4, 3.2, 3.6, 3, 3.4, 2.9, 3.7, 3.8, 4.2, 4.1, 2.6, 4.1, 3.3, 3.5, 3.8, 4, 3.6, 3.7, 3.6, 4.2, 4.2, 2.5, 3.1, 3.1, 3.4, 3.5, 3.5, 3.7, 3.7, 3.6, 3.3, 3.7, 3.7, 4, 4, 4.1, 4.1, 3.6, 3.8, 3.6, 3.2, 3.4, 3.4, 3.3, 3.8, 3.5, 4.1, 4.1, 4.3, 4.3, 3.6, 3.9, 3.7, 3.8, 3.7, 3.9, 3.9, 3.8, 3.6, 3, 3.7, 3.4, 1.4, 3.4, 3.5, 3.8, 3.6, 3.7, 3.7, 3.9, 2.8, 2.7, 3.8, 3.8, 2, 3.6, 3.9, 3.5, 4.5, 3.9, 4.3, 3.4, 3.8, 3.2, 3.5, 3.8, 3.1, 3.5, 3.7, 3.2, 3.6, 3.2, 4.2, 3.6, 2.8, 2.3, 3.6, 3, 3.9, 3.9, 3.1, 3.8, 3.2, 3.1, 3.8, 3.9, 3.2, 3.3, 3.5, 3.6, 3.2, 2.6, 3.3, 3.2, 3.7, 3.8, 3.2, 3.8, 2.8];

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

function gamecubeMessage(): Discord.MessageOptions 
{
  const gamecube_index = Math.floor(Math.random() * gamecube_list.length);
  const gamecubeName = gamecube_list[gamecube_index];
  const avatarURL = client.user.avatarURL() || undefined;
  const gamecubeNameScore = gamecube_score_list[gamecube_index];
  const embed = new Discord.MessageEmbed()
    .addField(`${gamecubeName}`, `Score: ${gamecubeNameScore}`);
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

        //QQ addition (GameCube)
        if(message.content.toLowerCase().includes("gamecube"))
        {
          message.channel.send(gamecubeMessage())
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
