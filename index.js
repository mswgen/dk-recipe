const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios').default;
const dotenv = require('dotenv');
dotenv.config();
const MongoDB = require('mongodb');
const DBClient = new MongoDB.MongoClient(`mongodb+srv://user:${process.env.MONGO_PW}@dk-recipe.3bhxr.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true
});
let db = undefined;
client.on('ready', () => {
    console.log(`Login ${client.user.username}\n--------------------`);
    DBClient.connect().then(() => {
        db = DBClient.db(process.env.DBNAME).collection(process.env.COLLECTION_NAME);
    })
});
client.on('message', async message => {
    if (!(await db.findOne({_id: interaction.member.user.id}))) {
        await db.insertOne({
            _id: interaction.member.user.id,
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
                oneHandSword: 0
            }
        });
    }
    if (message.channel.id == '796291747860840468') {
        await db.updateOne({_id: interaction.member.user.id}, {
            $set: {
                chats: {
                    hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill,
                    mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine + 1
                }
            }
        });
    } else if (message.channel.id == '796293274016153640') {
        await db.updateOne({_id: interaction.member.user.id}, {
            $set: {
                chats: {
                    hill: (await db.findOne({_id: interaction.member.user.id})).chats.hill + 1,
                    mine: (await db.findOne({_id: interaction.member.user.id})).chats.mine
                }
            }
        });
    }
});
client.on('raw', async rawData => {
    if (rawData.t != 'INTERACTION_CREATE') return;
    let interaction = rawData.d;
    await axios.post(`https://discord.com/api/interactions/${interaction.id}/${interaction.token}/callback`, {
        type: 5
    });
    if (interaction.data.name == 'inventory') {
        client.channels.cache.get(interaction.channel_id).startTyping(1);
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
        client.channels.cache.get(interaction.channel_id).stopTyping(true);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
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
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                }
            }
        }
    }
});
client.login(process.env.TOKEN);