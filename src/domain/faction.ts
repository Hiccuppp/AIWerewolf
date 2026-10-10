/**
 * Faction — the camp a role belongs to.
 *
 * The victory condition only needs one distinction: wolves versus everyone else
 * (gods and villagers win together). God/villager is a *role category*, not a
 * faction, so it is deliberately not modelled here.
 */
export type Faction = 'wolf' | 'good';
