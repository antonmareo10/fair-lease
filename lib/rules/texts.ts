import type { LawText } from "./types";

/**
 * Legal texts, copied literally from the BOE consolidated versions as checked by
 * hand in LEGAL_RULES.md (21 Oct 2026). English lines are unofficial translations.
 */

const LAU = "https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003";

export const LAW = {
  LAU_36_1: {
    article: "LAU art. 36.1",
    boeUrl: `${LAU}#a36`,
    quoteEs:
      "A la celebración del contrato será obligatoria la exigencia y prestación de fianza en metálico en cantidad equivalente a una mensualidad de renta en el arrendamiento de viviendas",
    quoteEn: "When the contract is signed, a cash deposit equal to one month's rent is required for the rental of a home.",
  },
  LAU_36_5: {
    article: "LAU art. 36.5",
    boeUrl: `${LAU}#a36`,
    quoteEs:
      "Las partes podrán pactar cualquier tipo de garantía del cumplimiento por el arrendatario de sus obligaciones arrendaticias adicional a la fianza en metálico. En el caso del arrendamiento de vivienda, en contratos de hasta cinco años de duración, o de hasta siete años si el arrendador fuese persona jurídica, el valor de esta garantía adicional no podrá exceder de dos mensualidades de renta.",
    quoteEn:
      "The parties may agree any kind of guarantee of the tenant's obligations on top of the cash deposit. For a home, in contracts of up to five years, or up to seven if the landlord is a company, this additional guarantee may not exceed two months' rent.",
  },
  LAU_36_5_INSURANCE: {
    article: "LAU art. 36.5 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a36`,
    quoteEs: "En ningún caso podrá exigirse al arrendatario la contratación de seguros de impago de renta u otras coberturas análogas.",
    quoteEn: "The tenant may never be required to take out rent-default insurance or any similar cover.",
  },
  LAU_36_4: {
    article: "LAU art. 36.4",
    boeUrl: `${LAU}#a36`,
    quoteEs:
      "El saldo de la fianza en metálico que deba ser restituido al arrendatario al final del arriendo, devengará el interés legal, transcurrido un mes desde la entrega de las llaves por el mismo sin que se hubiere hecho efectiva dicha restitución.",
    quoteEn:
      "The balance of the cash deposit owed to the tenant at the end of the lease earns legal interest once a month has passed since the keys were handed back without it being returned.",
  },
  LAU_20_1_FEES_B: {
    article: "LAU art. 20.1",
    boeUrl: `${LAU}#a20`,
    quoteEs: "Los gastos de gestión inmobiliaria y los de formalización del contrato serán a cargo del arrendador.",
    quoteEn: "Property-management and contract-formalisation costs are paid by the landlord.",
  },
  LAU_20_2_FEES_C: {
    article: "LAU art. 20.2 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a20`,
    quoteEs:
      "Los gastos de gestión inmobiliaria y de formalización del contrato no podrán ser repercutidos al arrendatario, ni directa ni indirectamente, bajo ningún concepto o denominación.",
    quoteEn:
      "Property-management and contract-formalisation costs may not be passed on to the tenant, directly or indirectly, under any heading or name.",
  },
  LAU_20_1_FEES_A: {
    article: "LAU art. 20.1 (2019 text)",
    boeUrl: `${LAU}#a20`,
    quoteEs: "Los gastos de gestión inmobiliaria y de formalización del contrato serán a cargo del arrendador, cuando este sea persona jurídica.",
    quoteEn: "Property-management and contract-formalisation costs are paid by the landlord when the landlord is a company.",
  },
  LAU_20_1_COMMUNITY: {
    article: "LAU art. 20.1",
    boeUrl: `${LAU}#a20`,
    quoteEs: "Para su validez, este pacto deberá constar por escrito y determinar el importe anual de dichos gastos a la fecha del contrato.",
    quoteEn: "To be valid, this agreement must be in writing and state the yearly amount of those costs at the date of the contract.",
  },
  LAU_20_1_TAXES_C: {
    article: "LAU art. 20.1 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a20`,
    quoteEs:
      "En ningún caso podrán imponerse los tributos asociados a la vivienda a la parte arrendataria, excepto en los supuestos en los que dicha parte tenga la condición de obligado tributario.",
    quoteEn: "Taxes linked to the home may never be imposed on the tenant, except where the tenant is the taxpayer by law.",
  },
  LAU_17_2: {
    article: "LAU art. 17.2",
    boeUrl: `${LAU}#a17`,
    quoteEs: "En ningún caso podrá el arrendador exigir el pago anticipado de más de una mensualidad de renta.",
    quoteEn: "The landlord may never require more than one month's rent to be paid in advance.",
  },
  LAU_17_3: {
    article: "LAU art. 17.3",
    boeUrl: `${LAU}#a17`,
    quoteEs:
      "El pago se efectuará a través de medios electrónicos. Excepcionalmente, cuando alguna de las partes carezca de cuenta bancaria o acceso a medios electrónicos de pago y a solicitud de esta, se podrá efectuar en metálico y en la vivienda arrendada.",
    quoteEn:
      "Payment is made electronically. Exceptionally, when one of the parties has no bank account or electronic means of payment and asks for it, it may be made in cash at the rented home.",
  },
  LAU_9_1: {
    article: "LAU arts. 9.1 and 6",
    boeUrl: `${LAU}#a9`,
    quoteEs:
      "Si esta fuera inferior a cinco años, o inferior a siete años si el arrendador fuese persona jurídica, llegado el día del vencimiento del contrato, este se prorrogará obligatoriamente por plazos anuales hasta que el arrendamiento alcance una duración mínima de cinco años, o de siete años si el arrendador fuese persona jurídica, salvo que el arrendatario manifieste al arrendador, con treinta días de antelación como mínimo a la fecha de terminación del contrato o de cualquiera de las prórrogas, su voluntad de no renovarlo.",
    quoteEn:
      "If the agreed term is under five years (seven if the landlord is a company), the contract is extended by law, year by year, until it reaches five years (or seven), unless the tenant tells the landlord at least thirty days before the end of the contract or of any extension that they don't want to renew.",
  },
  LAU_9_3: {
    article: "LAU art. 9.3",
    boeUrl: `${LAU}#a9`,
    quoteEs:
      "Una vez transcurrido el primer año de duración del contrato y siempre que el arrendador sea persona física, no procederá la prórroga obligatoria del contrato cuando, al tiempo de su celebración, se hubiese hecho constar en el mismo, de forma expresa, la necesidad para el arrendador de ocupar la vivienda arrendada antes del transcurso de cinco años para destinarla a vivienda permanente para sí o sus familiares en primer grado de consanguinidad o por adopción o para su cónyuge en los supuestos de sentencia firme de separación, divorcio o nulidad matrimonial.",
    quoteEn:
      "After the first year, and only if the landlord is an individual, the legal extension doesn't apply when the contract stated expressly, from signing, that the landlord may need the home within five years as a permanent home for themselves, their first-degree relatives, or their spouse after a final separation, divorce or annulment.",
  },
  LAU_11_AB: {
    article: "LAU art. 11",
    boeUrl: `${LAU}#a11`,
    quoteEs:
      "El arrendatario podrá desistir del contrato de arrendamiento, una vez que hayan transcurrido al menos seis meses, siempre que se lo comunique al arrendador con una antelación mínima de treinta días. Las partes podrán pactar en el contrato que, para el caso de desistimiento, deba el arrendatario indemnizar al arrendador con una cantidad equivalente a una mensualidad de la renta en vigor por cada año del contrato que reste por cumplir. Los períodos de tiempo inferiores al año darán lugar a la parte proporcional de la indemnización.",
    quoteEn:
      "After at least six months, the tenant may leave with thirty days' notice. The contract may say the tenant then owes one month's current rent for each year left, with shorter periods prorated.",
  },
  LAU_11_3_C: {
    article: "LAU art. 11.3 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a11`,
    quoteEs: "En los dos apartados anteriores el desistimiento del arrendatario así ejercido no generará derecho de indemnización en favor del arrendador.",
    quoteEn: "In both cases above, a tenant who leaves this way owes the landlord no compensation.",
  },
  LAU_18_1_B: {
    article: "LAU art. 18.1",
    boeUrl: `${LAU}#a18`,
    quoteEs:
      "Durante la vigencia del contrato, la renta solo podrá ser actualizada por el arrendador o el arrendatario en la fecha en que se cumpla cada año de vigencia del contrato, en los términos pactados por las partes. En defecto de pacto expreso, no se aplicará actualización de rentas a los contratos.",
    quoteEn:
      "During the contract the rent can only be updated on each yearly anniversary, on the agreed terms. If nothing was agreed, the rent is not updated.",
  },
  LAU_18_1_C: {
    article: "LAU art. 18.1 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a18`,
    quoteEs:
      "En todo caso, el incremento producido como consecuencia de la actualización anual de la renta no podrá exceder del resultado de aplicar la variación porcentual experimentada por el Índice de Referencia para la Actualización Anual de los Contratos de Arrendamiento de Vivienda (IRAV)",
    quoteEn:
      "In any case, the yearly update may not exceed the percentage change of the official reference index for updating home rental contracts (IRAV).",
  },
  RDL_29_DF6: {
    article: "RDL 29/2026, DF 6ª (pending Congress vote)",
    boeUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2026-20823",
    quoteEs:
      "En los demás casos, el incremento de la renta será el que resulte del nuevo pacto entre las partes. En ausencia de este nuevo pacto entre las partes, el incremento de la renta a aplicar no podrá ser superior al dos por ciento.",
    quoteEn:
      "In other cases, the rent increase is whatever the parties newly agree. Without that new agreement, the increase may not exceed two per cent.",
  },
  LAU_21: {
    article: "LAU arts. 21.1 and 21.4",
    boeUrl: `${LAU}#a21`,
    quoteEs:
      "El arrendador está obligado a realizar, sin derecho a elevar por ello la renta, todas las reparaciones que sean necesarias para conservar la vivienda en las condiciones de habitabilidad para servir al uso convenido, salvo cuando el deterioro de cuya reparación se trate sea imputable al arrendatario […] Las pequeñas reparaciones que exija el desgaste por el uso ordinario de la vivienda serán de cargo del arrendatario.",
    quoteEn:
      "The landlord must carry out, without raising the rent, every repair needed to keep the home habitable, unless the damage is the tenant's fault […] Small repairs caused by ordinary wear are the tenant's.",
  },
  CE_18_2: {
    article: "Spanish Constitution art. 18.2",
    boeUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229#a18",
    quoteEs:
      "El domicilio es inviolable. Ninguna entrada o registro podrá hacerse en él sin consentimiento del titular o resolución judicial, salvo en caso de flagrante delito.",
    quoteEn: "The home is inviolable. No one may enter or search it without the occupant's consent or a court order, except in flagrante delicto.",
  },
  LBRL_15: {
    article: "Ley 7/1985 (LBRL) art. 15",
    boeUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-1985-5392#a15",
    quoteEs: "Toda persona que viva en España está obligada a inscribirse en el Padrón del municipio en el que resida habitualmente.",
    quoteEn: "Everyone who lives in Spain must register on the municipal register (Padrón) of the town where they usually live.",
  },
  LAU_25_8_C: {
    article: "LAU art. 25.8 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a25`,
    quoteEs: "Las partes no podrán pactar la renuncia del arrendatario al derecho de adquisición preferente.",
    quoteEn: "The parties may not agree that the tenant gives up the preferential right to buy.",
  },
  LAU_25_8_AB: {
    article: "LAU art. 25.8",
    boeUrl: `${LAU}#a25`,
    quoteEs:
      "las partes podrán pactar la renuncia del arrendatario al derecho de adquisición preferente. En los casos en los que se haya pactado dicha renuncia, el arrendador deberá comunicar al arrendatario su intención de vender la vivienda con una antelación mínima de treinta días",
    quoteEn:
      "the parties may agree that the tenant gives up the preferential right to buy. Where they do, the landlord must tell the tenant at least thirty days before selling the home.",
  },
  LAU_7_2_C: {
    article: "LAU art. 7.2 (since 8 Oct 2026)",
    boeUrl: `${LAU}#a7`,
    quoteEs:
      "Los contratos de arrendamiento de vivienda temporal deberán prever de forma expresa la causa que motiva el desplazamiento temporal del arrendatario. Dicha causa deberá ser real y acreditable, recayendo sobre el arrendador la carga de la prueba de su existencia. La ausencia de una causa de temporalidad debidamente prevista en el contrato lo privará de su naturaleza temporal y comportará su sumisión al presente título en las mismas condiciones que los contratos de arrendamiento de vivienda habitual",
    quoteEn:
      "Temporary home rentals must state expressly why the tenant is staying temporarily. The reason must be real and provable, and the landlord must prove it. Without a properly stated reason the contract loses its temporary nature and is governed like a permanent-home rental.",
  },
  LAU_3_2: {
    article: "LAU art. 3.2 · Civil Code art. 6.4",
    boeUrl: `${LAU}#a3`,
  },
  LAU_4_2: { article: "LAU art. 4.2", boeUrl: `${LAU}#a4` },
  LAU_8: { article: "LAU art. 8", boeUrl: `${LAU}#a8` },
  LAU_23_1: { article: "LAU art. 23.1", boeUrl: `${LAU}#a23` },
  LAU_20_3: { article: "LAU art. 20.3", boeUrl: `${LAU}#a20` },
} satisfies Record<string, LawText>;

export const DISCLAIMER =
  "Fair Lease is an information tool, not legal advice. It checks your contract against a small set of rules from Spanish law (the tenancy act, LAU, as consolidated in the BOE on 7 Oct 2026) and shows you the exact article. For a decision that matters, talk to a tenants' union, your city's consumer office or a lawyer.";

/** Latest IRAV (INE): 2.54 % for September 2026, published 14 Oct 2026 (LEGAL_RULES.md §6). */
export const IRAV_PERCENT = 2.54;
export const DF6_WINDOW = { from: "2026-10-08", to: "2027-12-31" } as const;
