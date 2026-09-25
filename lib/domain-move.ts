// The app moved from sequinn.xyz/schoolmanage to school.sequinn.xyz.
// Visits to the old address get a one-time notice (see app/moved) that
// forwards to the same page on the new domain once acknowledged. After
// MOVE_DEADLINE the old address stops forwarding and only says where the
// app went.

export const NEW_ORIGIN = "https://school.sequinn.xyz";
export const OLD_HOSTS = ["sequinn.xyz", "www.sequinn.xyz"];

// 30 days after the move (2026-09-25). End of day, US Eastern.
export const MOVE_DEADLINE = new Date("2026-10-25T23:59:59-04:00");

export const MOVED_ACK_KEY = "ss-domain-move-ack";
