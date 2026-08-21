import { FileDown, Plus } from "lucide-react";

import {
  Btn,
  Bullets,
  Note,
  OpenScreen,
  P,
  Section,
  Step,
  Steps,
  Term,
  Where,
} from "../help-ui";

export function Dietas() {
  return (
    <>
      <P>
        La dieta de un cliente es un calendario: semanas, y a cada día de la
        semana se le asigna un menú de los que ya tienes hechos. Se monta igual
        que una rutina, y con las mismas reglas de estado.
      </P>

      <OpenScreen
        href="/clients"
        label="Abrir Clientes"
        note="Las dietas se crean dentro de la ficha"
      />

      <Section id="crear" title="Crear la dieta">
        <Steps>
          <Step title="Desde la ficha del cliente">
            En la tarjeta <Term>Planes de dieta</Term>, pulsa{" "}
            <Btn icon={Plus}>Nueva dieta</Btn>.
          </Step>
          <Step title="Título, fechas y estado">
            Igual que en las rutinas: en <Term>Borrador</Term> es tuya, en{" "}
            <Term>Activo</Term> la ve el cliente.
          </Step>
          <Step title="Fija los objetivos del día">
            <Term>Calorías</Term>, <Term>Proteína (g)</Term>,{" "}
            <Term>Carbos (g)</Term> y <Term>Grasas (g)</Term>. Son opcionales,
            pero son los que hacen útil el semáforo del editor.
          </Step>
          <Step title="Asigna un menú a cada día">
            Semana a semana, eligiendo de tus{" "}
            <Where href="/menus">Menús</Where>. No hace falta llenar los siete
            días.
          </Step>
        </Steps>
      </Section>

      <Section id="semaforo" title="El semáforo de objetivos">
        <P>
          Si has puesto objetivos, cada día compara lo que suma el menú asignado
          con lo que pediste, y lo pinta:
        </P>
        <Bullets>
          <li>
            <strong>Verde</strong> — en el objetivo. Cuenta como acertado
            cualquier cosa dentro de un margen del 10 %.
          </li>
          <li>
            <strong>Ámbar</strong> — se queda por debajo.
          </li>
          <li>
            <strong>Rojo</strong> — se pasa.
          </li>
        </Bullets>
        <P>
          Es una ayuda para cuadrar, no una prohibición: puedes dejar un día en
          rojo si sabes lo que haces.
        </P>
        <Note>
          ¿El menú te encaja pero se queda corto de calorías? No lo rehagas:
          escálalo desde <Where href="/menus">Menús</Where> y asigna el menú
          nuevo que sale de ahí.
        </Note>
      </Section>

      <Section id="que-ve" title="Lo que ve el cliente">
        <P>
          En su portal, en <strong>Dieta</strong>, ve cada día con sus comidas,
          los alimentos con sus cantidades y el total de calorías y macros. No ve
          tus notas internas ni los menús que no le has asignado.
        </P>
        <P>
          Puede descargarla en PDF o Word desde su propio portal, y tú también
          desde el plan abierto con{" "}
          <Btn icon={FileDown} variant="secondary">PDF</Btn> o{" "}
          <Btn icon={FileDown} variant="secondary">Word</Btn>.
        </P>
      </Section>

      <Section id="cambiar" title="Cambiar la dieta sobre la marcha">
        <P>
          Editar la dieta activa cambia lo que el cliente ve al momento: no hay
          que reenviarle nada. Si prefieres preparar la siguiente etapa con
          calma, créala en <Term>Borrador</Term> y actívala cuando toque —
          entonces conviene archivar la anterior para no tener dos activas.
        </P>
      </Section>
    </>
  );
}
