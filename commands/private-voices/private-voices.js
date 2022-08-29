const { Client, CommandInteraction, ButtonBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js')
const { SlashCommandBuilder, Embed } = require('@discordjs/builders')

const Guild = require('../../models/Guild')
module.exports = {
    slash: new SlashCommandBuilder()
        .setName('private-voice')
        .setDescription("Создать приватные голосовые каналы."),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    async execute(client, interaction) {
        let data = await Guild.findOne({ guildId: interaction.guild.id });
        if (!data) {
            await Guild.create({ guildId: interaction.guild.id });
        }
        let newdata = await Guild.findOne({ guildId: interaction.guild.id });
        if (newdata?.private_voices?.categoryId && newdata?.private_voices?.channelId != null) {
            let btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('delete').setLabel('Удалить').setStyle('DANGER'))
            await interaction.reply({ content: `🔨_ _`, ephemeral: true })
            let message = await interaction.channel.send({ embeds: [new EmbedBuilder().setColor('BLURPLE').setDescription('Система приватных комнат уже существует, удалить?')], components: [btn] })
            setTimeout(() => {
                message.edit({ components: [] }).catch(() => null)
            }, 20 * 1000);
            let collector = message.createMessageComponentCollector()
            collector.on('collect', async (i) => {
                if (interaction.user.id != i.user.id) return i.deferUpdate().catcha(() => null);
                if (i.customId == 'delete') {
                    message.edit({ components: [], content: `Система приватных комнат Удалена ✅` })
                    let data = await Guild.findOne({ guildId: interaction.guild.id })
                    let channelId = await client.channels.fetch(data?.private_voices?.channelId)
                    let textId = await client.channels.fetch(data?.private_voices?.textId)
                    let categoryId = await client.channels.fetch(data?.private_voices?.categoryId)
                    channelId.delete().catch(() => null)
                    textId.delete().catch(() => null)
                    categoryId.delete().catch(() => null)
                    return await Guild.updateOne({ guildId: interaction.guild.id }, {
                        $set: {
                            'private_voices': {}
                        }
                    })
                }
            })
        } else {
            let categoryId = await interaction.guild.channels.create(`Join To Create [+]`, {
                type: 'GUILD_CATEGORY',
            })
            let channelId = await interaction.guild.channels.create(`Create [+]`, {
                type: 'GUILD_VOICE',
                parent: categoryId,
                userLimit: 1,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: ['CONNECT'],
                        deny: ['SPEAK']
                    }
                ]
            })
            let textId = await interaction.guild.channels.create('settings', {
                parent: categoryId,
                topic: `Управление приватного канала`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['SEND_MESSAGES']
                    }
                ]
            })
            // КНОПКИ УПРАВЛЕНИЯ
            let rename = new ButtonBuilder().setCustomId('rename').setEmoji('✏️').setStyle('SECONDARY');
            let lock = new ButtonBuilder().setCustomId('lock').setEmoji('🔒').setStyle('SECONDARY');
            let bit = new ButtonBuilder().setCustomId('bit').setEmoji('📻').setStyle('SECONDARY')
            let limit = new ButtonBuilder().setCustomId('limit').setEmoji('🫂').setStyle('SECONDARY')
            let kick = new ButtonBuilder().setCustomId('kick').setEmoji('🚫').setStyle('SECONDARY')

            let Buttons = new ActionRowBuilder().addComponents([lock, rename, bit, limit, kick])

            let Embed = new EmbedBuilder().setAuthor({ name: 'Управление приватного канала', iconURL: interaction.guild.iconURL() })
                .setDescription('🔒 — открыть / закрыть канал.\n✏️ — переменовать канал.\n📻 — установить битрейт канала.\n🫂 — установить лимит пользователей.\n🚫 — выгнать пользователя с голосового канала.')
                .setColor('BLURPLE')
            textId.send({ embeds: [Embed], components: [Buttons] })
            await Guild.updateOne({ guildId: interaction.guild.id }, {
                $set: {
                    'private_voices.mode': true,
                    'private_voices.categoryId': categoryId,
                    'private_voices.channelId': channelId,
                    'private_voices.textId': textId,
                }
            })

            await interaction.reply({ content: `Каналы успешно созданы.` })
        }
    }
}