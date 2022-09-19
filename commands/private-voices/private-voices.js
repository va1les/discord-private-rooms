const { Client, CommandInteraction, ButtonBuilder, ActionRowBuilder, EmbedBuilder, ChannelType, PermissionsBitField, UserFlagsBitField, ButtonStyle } = require('discord.js')
const { SlashCommandBuilder, Embed } = require('@discordjs/builders')

const Guild = require('../../models/Guild');
const BitField = require('sparse-bitfield');
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
            let btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('delete').setLabel('Удалить').setStyle(ButtonStyle.Danger))
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
                    let channelId = await client.channels.fetch(data?.private_voices?.channelId).catch(() => null)
                    let textId = await client.channels.fetch(data?.private_voices?.textId).catch(() => null)
                    let categoryId = await client.channels.fetch(data?.private_voices?.categoryId).catch(() => null)
                    channelId?.delete().catch(() => null)
                    textId?.delete().catch(() => null)
                    categoryId?.delete().catch(() => null)
                    return await Guild.updateOne({ guildId: interaction.guild.id }, {
                        $set: {
                            'private_voices': {}
                        }
                    })
                }
            })
        } else {
            let categoryId = await interaction.guild.channels.create({
                name: `Join To Create [+]`,
                type: ChannelType.GuildCategory,
            })
            let channelId = await interaction.guild.channels.create({
                name: `Create [+]`,
                type: ChannelType.GuildVoice,
                parent: categoryId,
                userLimit: 1,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        allow: [PermissionsBitField.Flags.Connect],
                        deny: [PermissionsBitField.Flags.Speak]
                    }
                ]
            })
            let textId = await interaction.guild.channels.create({
                name: `settigs`,
                parent: categoryId,
                topic: `Управление приватного канала`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ]
            })
            // КНОПКИ УПРАВЛЕНИЯ
            let rename = new ButtonBuilder().setCustomId('rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary);
            let lock = new ButtonBuilder().setCustomId('lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
            let bit = new ButtonBuilder().setCustomId('bit').setEmoji('📻').setStyle(ButtonStyle.Secondary)
            let limit = new ButtonBuilder().setCustomId('limit').setEmoji('🫂').setStyle(ButtonStyle.Secondary)
            let kick = new ButtonBuilder().setCustomId('kick').setEmoji('🚫').setStyle(ButtonStyle.Secondary)

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