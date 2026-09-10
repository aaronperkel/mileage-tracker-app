/*
 * The three workbooks already submitted: June, August and September 2026 to date.
 *
 * Extracted from JUN.xlsx / AUG.xlsx / SEP.xlsx before those files were deleted
 * from this repo — they are personal records and do not belong in git, but the
 * readings in them do belong in the app. Without this the "last reading" hint on
 * the home screen has nothing to show until the log has been kept for a while,
 * and the odometer's own history starts at an arbitrary point.
 *
 * July is absent because no sheet was submitted for it.
 *
 * Readings are integer tenths, converted with Decimal arithmetic so none of the
 * float drift visible in the workbooks made it across. Checked against the
 * sheets' own F33 totals: June 173.3, August 226.2, September 85.8.
 */

export type SeedTrip = {
  date: string;
  startTenths: number;
  endTenths: number | null;
};

export const SEED_TRIPS: readonly SeedTrip[] = [
  { date: '2026-06-08', startTenths: 964904, endTenths: 964951 },
  { date: '2026-06-09', startTenths: 965037, endTenths: 965102 },
  { date: '2026-06-10', startTenths: 965157, endTenths: 965290 },
  { date: '2026-06-11', startTenths: 965344, endTenths: 965446 },
  { date: '2026-06-12', startTenths: 965529, endTenths: 965648 },
  { date: '2026-06-15', startTenths: 965897, endTenths: 965991 },
  { date: '2026-06-16', startTenths: 966061, endTenths: 966199 },
  { date: '2026-06-17', startTenths: 966284, endTenths: 966386 },
  { date: '2026-06-18', startTenths: 966453, endTenths: 966583 },
  { date: '2026-06-22', startTenths: 966698, endTenths: 966885 },
  { date: '2026-06-23', startTenths: 966992, endTenths: 967223 },
  { date: '2026-06-24', startTenths: 967446, endTenths: 967493 },
  { date: '2026-06-25', startTenths: 967539, endTenths: 967583 },
  { date: '2026-06-26', startTenths: 967627, endTenths: 967713 },
  { date: '2026-06-29', startTenths: 968335, endTenths: 968464 },
  { date: '2026-06-30', startTenths: 968569, endTenths: 968648 },
  { date: '2026-08-03', startTenths: 984403, endTenths: 984496 },
  { date: '2026-08-04', startTenths: 984538, endTenths: 984683 },
  { date: '2026-08-05', startTenths: 984750, endTenths: 984859 },
  { date: '2026-08-06', startTenths: 984989, endTenths: 985138 },
  { date: '2026-08-07', startTenths: 986963, endTenths: 987033 },
  { date: '2026-08-11', startTenths: 987802, endTenths: 988075 },
  { date: '2026-08-13', startTenths: 988153, endTenths: 988291 },
  { date: '2026-08-14', startTenths: 988439, endTenths: 988562 },
  { date: '2026-08-17', startTenths: 988664, endTenths: 988781 },
  { date: '2026-08-18', startTenths: 988970, endTenths: 989089 },
  { date: '2026-08-19', startTenths: 989177, endTenths: 989243 },
  { date: '2026-08-20', startTenths: 989380, endTenths: 989472 },
  { date: '2026-08-24', startTenths: 992708, endTenths: 992811 },
  { date: '2026-08-25', startTenths: 992905, endTenths: 993086 },
  { date: '2026-08-26', startTenths: 993343, endTenths: 993428 },
  { date: '2026-08-27', startTenths: 993614, endTenths: 993711 },
  { date: '2026-08-28', startTenths: 994023, endTenths: 994189 },
  { date: '2026-08-31', startTenths: 994996, endTenths: 995132 },
  { date: '2026-09-01', startTenths: 995447, endTenths: 995523 },
  { date: '2026-09-02', startTenths: 995834, endTenths: 995969 },
  { date: '2026-09-03', startTenths: 996231, endTenths: 996406 },
  { date: '2026-09-04', startTenths: 996794, endTenths: 996933 },
  { date: '2026-09-08', startTenths: 999332, endTenths: 999510 },
  { date: '2026-09-09', startTenths: 999646, endTenths: 999801 },
];
