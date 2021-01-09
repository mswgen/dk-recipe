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
            $set: {chats: {mine: (await db.findOne({_id: message.author.id})).chats.mine + 1}}
        });
    } else if (message.channel.id == '796293274016153640') {
        await db.updateOne({_id: message.author.id}, {
            $set: {chats: {hill: (await db.findOne({_id: message.author.id})).chats.hill + 1}}
        });
    }
});
client.on('raw', async interaction => {
    if (interaction.t != 'INTERACTION_CREATE') return;
    await axios.post(`https://discord.com/api/interactions/${interaction.d.id}/${interaction.d.token}/callback`, {
        type: 5
    });
    if (interaction.d.data.name == 'inventory') {
        let inven = await db.findOne({_id: interaction.d.member.user.id});
        const embed = new Discord.MessageEmbed()
        .setTitle(`인벤토리 목록`)
        .setDescription(`${interaction.d.member.user.username}#${interaction.d.member.user.discriminator}님의 인벤토리 정보에요.`)
        .addField('채팅 수', `광산: ${inven.chats.mine}개\n언덕: ${inven.chats.hill}개`)
        .addField('재료', `금: ${inven.materials.gold}개\n철: ${inven.materials.iron}개\n나무: ${inven.materials.wood}개\n실: ${inven.materials.thread}개\n깃털: ${inven.materials.thread}개`)
        .setColor('RANDOM')
        .setFooter(`${interaction.d.member.user.username}#${interaction.d.member.user.discriminator}`, interaction.d.member.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.d.member.user.id}/${interaction.d.member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${interaction.d.member.user.discriminator % 5}.png`)
        .setTimestamp()
        client.channels.cache.get(interaction.d.channel_id).send(embed);
    }
});
client.login(process.env.TOKEN);