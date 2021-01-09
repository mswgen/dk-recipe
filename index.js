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
        .setColor('RANDOM')
        .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.d.member.user.id}/${interaction.d.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.d.member.user.discriminator % 5}.png`)
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
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.d.member.user.id}/${interaction.d.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.d.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                } else {
                    await db.updateOne({_id: message.author.id}, {
                        $set: {
                            chats: {
                                hill: (await db.findOne({_id: message.author.id})).chats.hill,
                                mine: (await db.findOne({_id: message.author.id})).chats.mine - 350
                            }
                        }
                    });
                    const embed = new Discord.MessageEmbed()
                    .setTitle('와우! 구매가 완료되었어요!')
                    .setColor('RANDOM')
                    .setDescription('`/inventory`를 입력해서 확인해보세요!')
                    .setFooter(`${interaction.member.user.username}#${interaction.member.user.discriminator}`, interaction.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.d.member.user.id}/${interaction.d.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.d.member.user.discriminator % 5}.png`)
                    .setTimestamp()
                    client.channels.cache.get(interaction.channel_id).send(embed);
                }
            }
        }
    }
});
client.login(process.env.TOKEN);