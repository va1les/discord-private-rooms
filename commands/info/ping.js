const { Client, CommandInteraction } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    slash: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Websocket пинг"),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    async execute(client, interaction) {
        interaction.default(`Пинг: ${client.ws.ping}`, false)
    }
}