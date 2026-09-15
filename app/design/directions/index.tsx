import type { DesignThemeId } from "@/lib/design/themes";
import { FightOperations } from "./fight-operations";
import { Championship } from "./championship";
import { AthleteEditorial } from "./athlete-editorial";
import { FightAcademy } from "./fight-academy";
import { FightScience } from "./fight-science";
import { FightJournal } from "./fight-journal";

export const DIRECTION_COMPONENTS: Record<DesignThemeId, () => React.JSX.Element> = {
  "fight-operations": FightOperations,
  championship: Championship,
  "athlete-editorial": AthleteEditorial,
  "fight-academy": FightAcademy,
  "fight-science": FightScience,
  "fight-journal": FightJournal,
};
