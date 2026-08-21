import { Plus, Scale } from "lucide-react";

import {
  Btn,
  Note,
  OpenScreen,
  P,
  Section,
  Step,
  Steps,
  Term,
  Where,
} from "../help-ui";

export function AlimentosComidasMenus() {
  return (
    <>
      <P>
        La dieta se construye en tres pisos, y cada uno se apoya en el anterior:
        un <strong>alimento</strong> es el pollo, una <strong>comida</strong> es
        tu desayuno de siempre, un <strong>menú</strong> es un día completo. Con
        los menús montas después la dieta de cada cliente.
      </P>

      <Section id="alimentos" title="Alimentos">
        <OpenScreen
          href="/foods"
          label="Abrir Alimentos"
          note="El catálogo con la ficha nutricional"
        />
        <P>
          Vienen 605 alimentos ya cargados con su información nutricional.
          Cada ficha se lee como la etiqueta de un envase: calorías, proteínas,
          hidratos, azúcares, grasas, saturadas, fibra y sal.
        </P>
        <P>
          Para añadir uno tuyo, <Btn icon={Plus}>Nuevo alimento</Btn>. Lo
          importante es la <Term>Cantidad de referencia</Term> y la{" "}
          <Term>Unidad</Term>: los valores que escribas son{" "}
          <strong>por esa cantidad</strong>. Lo normal es 100 g, pero un huevo o
          una rebanada se llevan mejor con 1 unidad.
        </P>
        <Note>
          Esa referencia es la que hace las cuentas posibles: si pones 200 g de
          un alimento definido por 100 g, la aplicación dobla sus valores.
        </Note>
      </Section>

      <Section id="comidas" title="Comidas">
        <OpenScreen
          href="/meal-templates"
          label="Abrir Comidas"
          note="Plantillas reutilizables: desayunos, meriendas…"
        />
        <Steps>
          <Step title="Crea la comida">
            <Btn icon={Plus}>Nueva comida</Btn> y ponle{" "}
            <Term>Nombre de la comida</Term> — «Desayuno proteico», por ejemplo.
          </Step>
          <Step title="Añade alimentos y cantidades">
            Con el buscador. De cada uno indicas cuánto entra, en gramos o en
            unidades.
          </Step>
          <Step title="Mira el total">
            Según añades, se calculan solas las calorías y los macros de la
            comida entera.
          </Step>
        </Steps>
        <P>
          El listado tiene buscador por nombre y filtro por rango de calorías,
          para encontrar rápido «algo de unas 400».
        </P>
      </Section>

      <Section id="menus" title="Menús">
        <OpenScreen
          href="/menus"
          label="Abrir Menús"
          note="Un día completo, listo para asignar"
        />
        <P>
          Un menú es un día entero: desayuno, media mañana, comida, merienda y
          cena. Se monta eligiendo comidas de las que ya tienes y ordenándolas
          con las flechas. El total del día se calcula solo.
        </P>

      </Section>

      <Section id="escalar" title="Escalar un menú a otras calorías">
        <P>
          El botón <Btn icon={Scale} variant="secondary">Escalar</Btn> de cada
          menú resuelve el caso de siempre: te sirve el mismo día, pero de 2.400
          en vez de 2.000. Escribes las calorías nuevas — con atajos de ±200 y
          ±400 — y se recalculan todas las cantidades.
        </P>
        <Note kind="warn">
          El resultado es un <strong>menú nuevo</strong>, no una modificación del
          original. Es deliberado: el menú viejo puede estar asignado a otras
          dietas y cambiarlo por debajo les movería el suelo.
        </Note>
      </Section>

      <Section id="orden" title="En qué orden montarlo">
        <P>
          De abajo arriba. Si te falta un alimento, créalo antes de montar la
          comida; si te falta una comida, créala antes de montar el menú. Y ya
          con los menús hechos, la dieta de cada cliente es cuestión de un rato:
          lo cuenta la guía de <Where href="/ayuda/dietas">Dietas del cliente</Where>.
        </P>
      </Section>
    </>
  );
}
