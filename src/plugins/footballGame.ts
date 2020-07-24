import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api';
import * as utf8 from 'utf8';
import client from '../redisClient';
import { getUsers, prettyPrint } from './stats/print';
const Fuse = require('fuse.js');
//   {
//     men: { type: 'uri', value: 'http://www.wikidata.org/entity/Q1938' },
//     menLabel: { 'xml:lang': 'en', type: 'literal', value: 'Bacary Sagna' }
//   }

interface WikiFootballDataBinding {
    men: { type: string; value: string };
    menLabel: { 'xml:lang': string; type: string; value: string };
}

interface WikiFootballData {
    head: { vars: string[] };
    results: { bindings: WikiFootballDataBinding[] };
}

const redisKey = 'football-players';
const redisKeyTeams = 'football-teams';

const endpointUrl = 'https://query.wikidata.org/sparql';
const sparqlQuery = `# men football players serie A
SELECT DISTINCT ?men ?menLabel
WHERE
{
       ?men wdt:P106 wd:Q937857 .
       SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
LIMIT 5000`;
const fullURL = endpointUrl + '?query=' + encodeURIComponent(sparqlQuery);

const build = (bot: TelegramBot) => (msg: TelegramBot.Message) => {
    client.del(redisKey);
    axios
        .get(fullURL, {
            headers: { Accept: 'application/sparql-results+json' },
        })
        .then((res) => {
            const data: WikiFootballData = res.data;
            data.results.bindings.forEach((b) => {
                const ID = b.men.value.replace(
                    'http://www.wikidata.org/entity/',
                    ''
                );
                client.sadd(redisKey, `${utf8.encode(b.menLabel.value)}:${ID}`);
            });
            bot.sendMessage(msg.chat.id, 'Il gioco è pronto');
        })
        .catch((err) => bot.sendMessage(msg.chat.id, err));
};

interface WikiFootballDataTeam {
    entities: {
        [id: string]: {
            labels: {
                en: {
                    value: string;
                };
            };
        };
    };
}

const getTeamName = async (teamID: string) => {
    const teamNameCache = await client.hget(redisKeyTeams, teamID);
    if (teamNameCache !== null) return teamNameCache;

    const res = await axios.get(queryURL(teamID));
    const data: WikiFootballDataTeam = res.data;
    const teamName = data.entities[teamID].labels.en.value;
    // store in cache
    client.hset(redisKeyTeams, teamID, teamName);
    return teamName;
};

const queryURL = (id: string) => `http://www.wikidata.org/entity/${id}.json`;

const getYear = (prop) => {
    if (prop === undefined || prop.length === 0) return '?';
    if (prop[0].datavalue === undefined) return '?';
    const year = new Date(
        prop[0].datavalue.value.time.replace('+', '')
    ).getFullYear();
    if (isNaN(year)) return '?';
    return year;
};

const getAmount = (prop) => {
    if (prop === undefined || prop.length === 0) return '?';
    return parseInt(prop[0].datavalue.value.amount);
};

const allTeams = async (teams) => {
    let teamsFormatted = [];
    for (const t of teams) {
        const teamID = t.mainsnak.datavalue.value.id;
        const teamName = await getTeamName(teamID);
        const startDate = getYear(t.qualifiers['P580']);
        const endDate = getYear(t.qualifiers['P582']);
        const numMatches = getAmount(t.qualifiers['P1350']);
        const numGoals = getAmount(t.qualifiers['P1351']);
        const teamString = `${startDate}-${endDate} ${teamName} - ${numMatches} (${numGoals})\n`;
        teamsFormatted.push(teamString);
    }
    return teamsFormatted;
};

const play = (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    const randomPlayer = await client.spop(redisKey);
    const randomPlayerName = utf8.decode(randomPlayer.split(':')[0]);
    const randomPlayerID = randomPlayer.split(':')[1];

    const res = await axios.get(queryURL(randomPlayerID));
    const data = res.data;
    const teams = data.entities[randomPlayerID].claims['P54'];
    const teamsFormatted = await allTeams(teams);

    bot.sendMessage(msg.chat.id, teamsFormatted.join(''));

    client.set(`${msg.chat.id}:solution`, randomPlayerName);
};

const solution = (bot: TelegramBot) => async (msg: TelegramBot.Message) => {
    const s = await client.get(`${msg.chat.id}:solution`);
    client.set(`${msg.chat.id}:solution`, null);
    bot.sendMessage(msg.chat.id, s);
};

const winner = (bot: TelegramBot) => async (
    msg: TelegramBot.Message,
    match: RegExpMatchArray
) => {
    const s = await client.get(`${msg.chat.id}:solution`);
    const options = {
        includeScore: true,
    };

    const fuse = new Fuse([s], options);

    const result = fuse.search(match[1]);
    if (result[0].score < 0.3) {
        const key = `chat:${msg.chat.id}:user:${msg.from.id}`;
        client.hincrby(key, 'football-game', 1);
        client.set(`${msg.chat.id}:solution`, null);
        bot.sendMessage(msg.chat.id, `@${msg.from.username} ha indovinato`);
    }
};

const ranking = (bot: TelegramBot) => async (
    msg: TelegramBot.Message
): Promise<void> => {
    const users = await getUsers(msg.chat.id, 'football-game');
    const sortedUsers = users.sort((a, b) => b.count - a.count);
    const message = prettyPrint(sortedUsers);
    bot.sendMessage(msg.chat.id, message);
};

export default { build, play, solution, winner, ranking };