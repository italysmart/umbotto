import axios from "axios";
import cfg from "../../config";
import { Competition } from "./types";

export const api = axios.create({
  baseURL: "http://api.football-data.org/v2",
  timeout: 1000,
  headers: { "X-Auth-Token": cfg.footballDataToken },
});

export const getCurrMatchday = async (): Promise<number> => {
  try {
    const res = await api.get<Competition>("/competitions/SA/");
    const competition = res.data;
    return competition.currentSeason.currentMatchday;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const overrideTeamNames = {
  108: "Inter",
  586: "Torino",
  1107: "SPAL",
  99: "Fiorentina",
  584: "Sampdoria",
  470: "Frosinone",
  104: "Cagliari",
  100: "Roma",
  102: "Atalanta",
  103: "Bologna",
  109: "Juventus",
  115: "Udinese",
  471: "Sassuolo",
  106: "Chievo",
  112: "Parma",
  445: "Empoli",
  113: "Napoli",
  107: "Genoa",
  110: "Lazio",
  98: "Milan",
  455: "Salernitana",
  450: "Verona",
  488: "Spezia",
  454: "Venezia",
};

export const refereeRoles = {
  ASSISTANT_REFEREE_N1: "Assistente",
  ASSISTANT_REFEREE_N2: "Assistente",
  FOURTH_OFFICIAL: "Quarto uomo",
  REFEREE: "Arbitro",
  VIDEO_ASSISANT_REFEREE_N1: "AVAR",
  VIDEO_ASSISANT_REFEREE_N2: "AVAR",
};
