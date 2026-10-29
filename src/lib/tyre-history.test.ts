import { describe, expect, it } from "vitest";
import { completedTyreHistory, depthChange, previousTyreVisit, type HistoryOrder } from "./tyre-history";
const visit: HistoryOrder = { id: "1", booking_key: "own", regnr: "ABC123", booking_date: "2026-10-29", finished_at: "2026-10-29T10:00:00Z", service: "Skifte och förvaring", status: "klar", depth_vf: 6, depth_hf: 6, depth_vb: 7, depth_hb: 7, tire_season: "winter", fitted_tire_set: "Michelin 205/55 R16" };
describe("kundens skifteshistorik", () => {
  it("visar endast färdiga skiften på kundens bokningar", () => expect(completedTyreHistory([visit, {...visit,id:"2",booking_key:"other"}, {...visit,id:"3",status:"paborjad"}, {...visit,id:"4",service:"Nyförvaring"}, {...visit,id:"5",finished_at:null}], ["own"]).map(v=>v.id)).toEqual(["1"]));
  it("beräknar förändring i mm", () => expect(depthChange(5.8,6.4)).toBe(-0.6));
  it("gissar inte saknade mätvärden", () => expect(depthChange(null,6)).toBeNull());
  it("jämför endast samma bil, säsong och dokumenterade däck", () => {
    const old={...visit,id:"old",finished_at:"2025-10-29T10:00:00Z"};
    expect(previousTyreVisit(visit,[{...old,tire_season:"summer"}, {...old,fitted_tire_set:"Nya däck"}, {...old,regnr:"ZZZ999"},old])?.id).toBe("old");
  });
  it("gissar inte säsong eller däck från aktuella lageruppgifter", () => expect(previousTyreVisit({...visit,tire_season:null},[visit])).toBeUndefined());
});