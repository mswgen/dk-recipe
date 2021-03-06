const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios').default;
const http = require('http');
const util = require('util');
const dotenv = require('dotenv');
dotenv.config();
const MongoDB = require('mongodb');
const DBClient = new MongoDB.MongoClient(`mongodb+srv://user:${process.env.MONGO_PW}@dk-recipe.3bhxr.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true
});
let db = undefined;
client.on('ready', () => {
    console.log(`Login ${client.user.username}\n--------------------`);
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('hello world');
    });
    server.listen(8080);
    setInterval(() => {
        axios.get('https://dk-recipe.dkbot.repl.co').then()
    }, 600000);
    DBClient.connect().then(() => {
        db = DBClient.db(process.env.DBNAME).collection(process.env.COLLECTION_NAME);
    })
});
client.on('message', async message => {
    if (!(await db.findOne({_id: message.author.id}))) {
        await db.insertOne({
            _id: message.author.id,
            chats: {
                mine: 0,
                hill: 0
            },
            materials: {
                gold: 0,
                iron: 0,
                wood: 0,
                thread: 0,
                feather: 0
            },
            items: {
                oneTimeSword: 0,
                arrow: 0,
                twoHandsSword: 0,
                oneHandSword: 0,
                nickChange: 0
            }
        });
    }
    if (message.channel.id == '796291747860840468') {
        await db.updateOne({_id: message.author.id}, {
            $set: {
                chats: {
                    hill: (await db.findOne({_id: message.author.id})).chats.hill,
                    mine: (await db.findOne({_id: message.author.id})).chats.mine + 1
                }
            }
        });
    } else if (message.channel.id == '796293274016153640') {
        await db.updateOne({_id: message.author.id}, {
            $set: {
                chats: {
                    hill: (await db.findOne({_id: message.author.id})).chats.hill + 1,
                    mine: (await db.findOne({_id: message.author.id})).chats.mine
                }
            }
        });
    }
});
client.on('raw', async rawData => {
    if (rawData.t != 'INTERACTION_CREATE') return;
    client.channels.cache.get(rawData.d.channel_id).startTyping(1);
    let interaction = rawData.d;
    await axios.post(`https://discord.com/api/interactions/${interaction.id}/${interaction.token}/callback`, {
        type: 5
    });
    if (interaction.data.name == 'inventory') {
        let inven = await db.findOne({_id: interaction.member.user.id});
        const embed = new Discord.MessageEmbed()
        .setTitle(`인벤토리 목록`)
        .setDescription(`${interaction.member.user.username}#${interaction.member.user.discriminator}님의 인벤토리 정보에요.`)
        .addField('채팅 수', `광산: ${inven.chats.mine}개\n언덕: ${inven.chats.hill}개`)
        .addField('재료', `금: ${inven.materials.gold}개\n철: ${inven.materials.iron}개\n나무: ${inven.materials.wood}개\n실: ${inven.materials.thread}개\n깃털: ${inven.materials.thread}개`)
        .addField('아이템', `일회용 칼: ${inven.items.oneTimeSword}개\n화살 연사: ${inven.items.arrow}개\n전사의 양손검: ${inven.items.twoHandsSword}개\n영웅의 한손검: ${inven.items.oneHandSword}개\n닉네임 변경권: ${inven.items.nickChange}개`)
        .setColor('RANDOM')
        .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
        .setTimestamp()
        client.channels.cache.get(interaction.channel_id).send(embed);
    } else if (interaction.data.name == 'buy') {
        if (interaction.data.options[0].name == 'material') {
            if (interaction.data.options[0].options[0].value == 'gold') {
                if ((await db.findOne({_id: interaction.member.user.id})).chats.mine < 350) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 채팅 수가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('<#796291747860840468>에서 조금 더 채팅을 쳐보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            chats: {
                                hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill,
                                mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine - 350
                            },
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold + 1,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'iron') {
                if ((await db.findOne({_id: interaction.member.user.id})).chats.mine < 200) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 채팅 수가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('<#796291747860840468>에서 조금 더 채팅을 쳐보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            chats: {
                                hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill,
                                mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine - 200
                            },
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron + 1,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'wood') {
                if ((await db.findOne({_id: interaction.member.user.id})).chats.hill < 70) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 채팅 수가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('<#796293274016153640>에서 조금 더 채팅을 쳐보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            chats: {
                                hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill - 70,
                                mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine
                            },
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood + 1,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            }
                        }
                    });
                    
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'thread') {
                if ((await db.findOne({_id: interaction.member.user.id})).chats.hill < 100) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 채팅 수가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('<#796293274016153640>에서 조금 더 채팅을 쳐보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            chats: {
                                hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill - 100,
                                mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine
                            },
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread + 1,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'feather') {
                if ((await db.findOne({_id: interaction.member.user.id})).chats.hill < 120) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 채팅 수가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('<#796293274016153640>에서 조금 더 채팅을 쳐보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            chats: {
                                hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill - 120,
                                mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine
                            },
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather + 1
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            }
        } else if (interaction.data.options[0].name == 'item') {
            if (interaction.data.options[0].options[0].value == 'oneTimeSword') {
                if ((await db.findOne({_id: interaction.member.user.id})).materials.wood < 2 || (await db.findOne({_id: interaction.member.user.id})).materials.iron < 1) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 재료가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('재료를 조금 더 모아보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron - 1,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood - 2,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            },
                            items: {
                                oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword + 1,
                                arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                                twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                                oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                                nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'arrow') {
                if ((await db.findOne({_id: interaction.member.user.id})).materials.wood < 4 || (await db.findOne({_id: interaction.member.user.id})).materials.iron < 1 || (await db.findOne({_id: interaction.member.user.id})).materials.thread < 2 || (await db.findOne({_id: interaction.member.user.id})).materials.feather < 2) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 재료가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('재료를 조금 더 모아보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron - 1,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood - 4,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread - 2,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather - 2
                            },
                            items: {
                                oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                                arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow + 1,
                                twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                                oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                                nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'twoHandsSword') {
                if ((await db.findOne({_id: interaction.member.user.id})).materials.wood < 5 || (await db.findOne({_id: interaction.member.user.id})).materials.iron < 3) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 재료가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('재료를 조금 더 모아보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron - 3,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood - 5,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            },
                            items: {
                                oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                                arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                                twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword + 1,
                                oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                                nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'oneHandSword') {
                if ((await db.findOne({_id: interaction.member.user.id})).materials.wood < 2 || (await db.findOne({_id: interaction.member.user.id})).materials.iron < 3 || (await db.findOne({_id: interaction.member.user.id})).materials.gold < 2) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 재료가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('재료를 조금 더 모아보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold - 2,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron - 3,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood - 2,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            },
                            items: {
                                oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                                arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                                twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                                oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword + 1,
                                nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            } else if (interaction.data.options[0].options[0].value == 'nickChange') {
                if ((await db.findOne({_id: interaction.member.user.id})).materials.wood < 5) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('이런, 재료가 부족해요.')
                    .setColor('RANDOM')
                    .setDescription('재료를 조금 더 모아보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle('구매 처리 중...')
                    .setColor('RANDOM')
                    .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                    await db.updateOne({_id: interaction.member.user.id}, {
                        $set: {
                            materials: {
                                gold: (await db.findOne({_id: interaction.member.user.id})).materials.gold,
                                iron: (await db.findOne({_id: interaction.member.user.id})).materials.iron,
                                wood: (await db.findOne({_id: interaction.member.user.id})).materials.wood - 5,
                                thread: (await db.findOne({_id: interaction.member.user.id})).materials.thread,
                                feather: (await db.findOne({_id: interaction.member.user.id})).materials.feather
                            },
                            items: {
                                oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                                arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                                twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                                oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                                nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange + 1
                            }
                        }
                    });
                    embed.setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    m.edit(embed);
                }
            }
        }
    } else if (interaction.data.name == 'use') {
        if (interaction.data.options[0].value == 'oneTimeSword') {
            if ((await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword < 1) {
                const embed = new Discord.MessageEmbed()
                .setTitle('이런, 아이템이 부족해요.')
                .setColor('RANDOM')
                .setDescription('아이템을 조금 더 모아보세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                client.channels.cache.get(interaction.channel_id).send(embed);
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle('사용 처리 중...')
                .setColor('RANDOM')
                .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                await db.updateOne({_id: interaction.member.user.id}, {
                    $set: {
                        items: {
                            oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword - 1,
                            arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                            twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                            oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                            nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                        }
                    }
                });
                embed.setTitle('와우! 아이템을 사용했어요!')
                .addField('사용한 아이템', '일회용 칼')
                .setColor('RANDOM')
                .setDescription(' ')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                m.edit(embed);
                client.channels.cache.get(interaction.channel_id).send('도<@724561925341446217>')
            }
        } else if (interaction.data.options[0].value == 'arrow') {
            if ((await db.findOne({_id: interaction.member.user.id})).items.arrow < 1) {
                const embed = new Discord.MessageEmbed()
                .setTitle('이런, 아이템이 부족해요.')
                .setColor('RANDOM')
                .setDescription('아이템을 조금 더 모아보세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                client.channels.cache.get(interaction.channel_id).send(embed);
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle('사용 처리 중...')
                .setColor('RANDOM')
                .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                await db.updateOne({_id: interaction.member.user.id}, {
                    $set: {
                        items: {
                            oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                            arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow - 1,
                            twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                            oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                            nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                        }
                    }
                });
                embed.setTitle('와우! 아이템을 사용했어요!')
                .setColor('RANDOM')
                .setDescription(' ')
                .addField('사용한 아이템', '화살 연사')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                m.edit(embed);
                client.channels.cache.get(interaction.channel_id).send('도<@724561925341446217>')
            }
        } if (interaction.data.options[0].value == 'twoHandsSword') {
            if ((await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword < 1) {
                const embed = new Discord.MessageEmbed()
                .setTitle('이런, 아이템이 부족해요.')
                .setColor('RANDOM')
                .setDescription('아이템을 조금 더 모아보세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                client.channels.cache.get(interaction.channel_id).send(embed);
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle('사용 처리 중...')
                .setColor('RANDOM')
                .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                await db.updateOne({_id: interaction.member.user.id}, {
                    $set: {
                        items: {
                            oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                            arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                            twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword - 1,
                            oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                            nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                        }
                    }
                });
                embed.setTitle('와우! 아이템을 사용했어요!')
                .setColor('RANDOM')
                .setDescription(' ')
                .addField('사용한 아이템', '전사의 양손검')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                m.edit(embed);
                client.channels.cache.get(interaction.channel_id).send('도<@724561925341446217>')
            }
        } if (interaction.data.options[0].value == 'oneHandSword') {
            if ((await db.findOne({_id: interaction.member.user.id})).items.oneHandSword < 1) {
                const embed = new Discord.MessageEmbed()
                .setTitle('이런, 아이템이 부족해요.')
                .setColor('RANDOM')
                .setDescription('아이템을 조금 더 모아보세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                client.channels.cache.get(interaction.channel_id).send(embed);
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle('사용 처리 중...')
                .setColor('RANDOM')
                .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                await db.updateOne({_id: interaction.member.user.id}, {
                    $set: {
                        items: {
                            oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                            arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                            twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                            oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword - 1,
                            nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange
                        }
                    }
                });
                embed.setTitle('와우! 아이템을 사용했어요!')
                .setColor('RANDOM')
                .addField('사용한 아이템', '영웅의 한손검')
                .setDescription(' ')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                m.edit(embed);
                client.channels.cache.get(interaction.channel_id).send('도<@724561925341446217>')
            }
        } if (interaction.data.options[0].value == 'nickChange') {
            if ((await db.findOne({_id: interaction.member.user.id})).items.nickChange < 1) {
                const embed = new Discord.MessageEmbed()
                .setTitle('이런, 아이템이 부족해요.')
                .setColor('RANDOM')
                .setDescription('아이템을 조금 더 모아보세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                client.channels.cache.get(interaction.channel_id).send(embed);
            } else {
                const embed = new Discord.MessageEmbed()
                .setTitle('사용 처리 중...')
                .setColor('RANDOM')
                .setDescription('데이터베이스를 처리하고 있어요. 조금만 기다려주세요!')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                let m = await client.channels.cache.get(interaction.channel_id).send(embed);
                await db.updateOne({_id: interaction.member.user.id}, {
                    $set: {
                        items: {
                            oneTimeSword: (await db.findOne({_id: interaction.member.user.id})).items.oneTimeSword,
                            arrow: (await db.findOne({_id: interaction.member.user.id})).items.arrow,
                            twoHandsSword: (await db.findOne({_id: interaction.member.user.id})).items.twoHandsSword,
                            oneHandSword: (await db.findOne({_id: interaction.member.user.id})).items.oneHandSword,
                            nickChange: (await db.findOne({_id: interaction.member.user.id})).items.nickChange - 1
                        }
                    }
                });
                embed.setTitle('와우! 아이템을 사용했어요!')
                .setColor('RANDOM')
                .addField('사용한 아이템', '닉네임 변경권')
                .setDescription(' ')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                m.edit(embed);
                client.channels.cache.get(interaction.channel_id).send('도<@724561925341446217>')
            }
        }
    } else if (interaction.data.name == 'eval') {
        if (interaction.member.user.id != '647736678815105037') return client.channels.cache.get(interaction.channel_id).send(`${client.user.username} 개발자만 사용할 수 있어요.`);
        const code = `
const Discord = require('discord.js');
const fs = require('fs');
const util = require('util');
const axios = require('axios').default;
const os = require('os');
const dotenv = require('dotenv');
const http = require('http');
const qs = require('querystring');
const url = require('url');

${interaction.data.options[0].value}`;
        const embed = new Discord.MessageEmbed()
            .setTitle(`Evaling...`)
            .setColor(0xffff00)
            .addField('Input', '```js\n' + interaction.data.options[0].value + '\n```')
            .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
            .setTimestamp()
        let m = await client.channels.cache.get(interaction.channel_id).send(embed);
        try {
            let output = eval(code);
            let type = typeof output;
            if (typeof output !== "string") {
                output = util.inspect(output);
            }
            if (output.length >= 1020) {
                output = `${output.substr(0, 1010)}...`;
            }
            output = output.replace(new RegExp(process.env.TOKEN, 'gi'), 'Secret');
            const embed2 = new Discord.MessageEmbed()
                .setTitle('Eval result')
                .setColor(0x00ffff)
                .addField('Input', '```js\n' + interaction.data.options[0].value + '\n```')
                .addField('Output', '```js\n' + output + '\n```')
                .addField('Type', '```js\n' + type + '\n```')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
            await m.edit({
                embed: embed2
            });
            await m.react('🗑');
            const filter = (r, u) => r.emoji.name == '🗑' && u.id == interaction.member.user.id;
            const collector = m.createReactionCollector(filter, {
                max: 1
            });
            collector.on('end', () => {
                m.delete();
            })
        } catch (err) {
            const embed3 = new Discord.MessageEmbed()
                .setTitle('Eval error...')
                .setColor(0xff0000)
                .addField('Input', '```js\n' + interaction.data.options[0].value + '\n```')
                .addField('Error', '```js\n' + err + '\n```')
                .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                .setTimestamp()
                await m.edit({
                    embed: embed3
                });
                await m.react('🗑');
                const filter = (r, u) => r.emoji.name == '🗑' && u.id == interaction.member.user.id;
                const collector = m.createReactionCollector(filter, {
                    max: 1
                });
                collector.on('end', () => {
                    m.delete();
                })
        }
    } else if (interaction.data.name == 'ping') {
        const embed = new Discord.MessageEmbed()
        .setTitle('Pinging...')
        .setColor('RANDOM')
        .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
        .setTimestamp()
        let m = await client.channels.cache.get(interaction.channel_id).send(embed);
        embed.setTitle('Pong!')
        .setColor("RANDOM")
        .addField('Latency', `${m.createdAt - new Date((parseInt(interaction.id) / 4194304 + 1420070400000))}ms`)
        .addField('API Latency', `${client.ws.ping}ms`)
        .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
        .setTimestamp()
        m.edit(embed);
    }
    client.channels.cache.get(interaction.channel_id).stopTyping(true);
});
client.login(process.env.TOKEN);