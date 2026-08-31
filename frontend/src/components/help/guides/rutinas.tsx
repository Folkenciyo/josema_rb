import {
  ClipboardList,
  Copy,
  FileDown,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";

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

export function Rutinas() {
  return (
    <>
      <P>
        Una rutina se organiza en tres niveles: el <strong>plan</strong> tiene{" "}
        <strong>semanas</strong>, cada semana tiene <strong>días</strong> y cada
        día tiene <strong>ejercicios</strong> con sus series y repeticiones.
      </P>

      <Section id="crear" title="Crear el plan">
        <Steps>
          <Step title="Desde la ficha del cliente">
            En la tarjeta <Term>Planes de entrenamiento</Term>, pulsa{" "}
            <Btn icon={Plus}>Nuevo plan</Btn>.
          </Step>
          <Step title="Ponle título, fechas y estado">
            <Term>Estado</Term> decide quién lo ve: en{" "}
            <Term>Borrador</Term> es tuyo, en <Term>Activo</Term> lo ve el
            cliente en su portal, y <Term>Archivado</Term> lo aparta sin
            borrarlo.
          </Step>
          <Step title="Marca la repetición si toca">
            La casilla <Term>Repetir las semanas hasta la fecha de fin</Term> es
            para la rutina de una semana que el cliente repite todo el mes. Sin
            ella, el calendario da el plan por terminado cuando se acaba la
            última semana escrita.
          </Step>
        </Steps>

        <Note>
          La <strong>fecha de inicio</strong> es la que ancla el plan al
          calendario: sin ella, la ficha no puede saber qué día tocaba entrenar.
        </Note>
      </Section>

      <Section id="semanas" title="Semanas y días">
        <P>
          Dentro del plan, cada semana es una pestaña.{" "}
          <Btn icon={Plus} variant="secondary">Añadir semana</Btn> crea la
          siguiente, y <Btn icon={Copy} variant="secondary">Duplicar</Btn> copia
          la que tengas delante con todos sus días y ejercicios — la forma rápida
          de hacer una progresión: duplicas y subes los kilos.
        </P>
        <P>
          Dentro de una semana marcas los días de entrenamiento y, en cada uno,
          añades ejercicios desde el buscador con sus filtros.
        </P>
        <P>
          Si añades una semana sin querer, la{" "}
          <Btn icon={Trash2} variant="danger">papelera</Btn> de la derecha de las
          pestañas la borra con todo lo que tenga dentro, y las siguientes se
          renumeran para no dejar hueco.
        </P>
        <Note>
          Cada cambio se guarda solo unos segundos después de hacerlo — añadir
          o quitar un ejercicio, tocar series, repeticiones o descanso, escribir
          una nota. No hace falta pulsar nada ni acordarte de guardar antes de
          cambiar de pestaña.
        </Note>
      </Section>

      <Section id="nota-del-dia" title="La nota del día">
        <P>
          Encima de los ejercicios de cada día hay un recuadro para lo que le
          pides a ese día entero: «necesito que hagas concentración de hombro»,
          «hoy vas suave, vienes de la lesión». Se guarda con la semana, como
          todo lo demás.
        </P>
        <P>
          El cliente la lee en su rutina del portal, al empezar el entrenamiento
          guiado y en el PDF y el Word que se descarga. Un día de descanso puede
          llevar solo la nota, sin ningún ejercicio.
        </P>
      </Section>

      <Section id="ejercicios" title="Lo que puedes ajustar de cada ejercicio">
        <Bullets>
          <li>
            <Term>Series</Term> y <Term>Reps</Term> — las repeticiones son texto
            libre, así que valen «8-12», «al fallo» o «30 s».
          </li>
          <li>
            <Term>Descanso</Term> — en segundos. Es lo que usa el temporizador
            del modo guiado del cliente.
          </li>
          <li>
            <Term>Nota</Term> — la línea de debajo de cada ejercicio, siempre a
            la vista. Es para el cliente: técnica, sensaciones, avisos. La ve en
            su rutina, en el modo guiado mientras entrena y en el PDF y el Word
            que se descarga.
          </li>
          <li>
            En <strong>Más opciones</strong>: <Term>Tempo</Term> (por ejemplo
            «3-1-1»).
          </li>
        </Bullets>
        <P>
          Los ejercicios se reordenan arrastrándolos por el asa de la izquierda.
        </P>
      </Section>

      <Section id="superseries" title="Ejercicios dobles (superseries)">
        <P>
          Cuando dos ejercicios se hacen encadenados —una serie de fondos en
          máquina, otra de tríceps en polea y ahí el descanso—, se meten juntos
          con <Btn icon={Link2} variant="secondary">Superserie</Btn>, el botón
          que hay junto a <Btn icon={Plus} variant="secondary">Añadir</Btn> en
          cada día. Elige los dos ejercicios <strong>en el orden en que se
          hacen</strong> y entran ya emparejados.
        </P>
        <Bullets>
          <li>
            Cada ejercicio conserva <strong>sus propias series y reps</strong>:
            puedes poner 12 en los fondos y 15 en la polea.
          </li>
          <li>
            El bloque se arrastra entero, y con <Term>Separar</Term> se deshace
            dejando los ejercicios sueltos.
          </li>
          <li>
            El bloque tiene <strong>su propia nota</strong>, encima de los dos
            ejercicios, para lo que va de la pareja entera: cómo encadenarlas,
            qué cuidar al pasar de una a otra. Cada ejercicio sigue pudiendo
            llevar la suya. Si separas el bloque, esa nota se va con él.
          </li>
          <li>
            El cliente lo ve marcado como <Term>A1</Term> y <Term>A2</Term> en
            su portal, en el PDF y en el Word. En el modo guiado el temporizador
            de descanso <strong>no salta entre A1 y A2</strong>: espera al final
            del bloque.
          </li>
        </Bullets>
      </Section>

      <Section id="plantillas" title="Reutilizar rutinas">
        <P>
          Lo que te funciona con uno sirve para el siguiente. Hay tres caminos y
          todos hacen lo mismo: copiar el árbol entero de semanas, días y
          ejercicios.
        </P>
        <Bullets>
          <li>
            <strong>Guardar la rutina de un cliente como plantilla</strong> — en
            el plan abierto, con{" "}
            <Btn icon={ClipboardList} variant="secondary">Guardar como rutina</Btn>
            . Se queda en <Where href="/routines">Rutinas</Where>.
          </li>
          <li>
            <strong>Crear una plantilla desde cero</strong> — en{" "}
            <Where href="/routines">Rutinas</Where>, que se edita igual que el
            plan de un cliente pero no es de nadie.
          </li>
          <li>
            <strong>Duplicar una rutina que ya tienes</strong> — con{" "}
            <Btn icon={Copy} variant="secondary">Duplicar</Btn> en su tarjeta de{" "}
            <Where href="/routines">Rutinas</Where>. Te pide el nombre de la
            copia y la deja lista para cambiarle lo que quieras sin tocar la
            original.
          </li>
          <li>
            <strong>Usar una rutina con un cliente</strong> — en su ficha, con{" "}
            <Btn variant="secondary">Usar una rutina</Btn>, en la cabecera de la
            tarjeta de planes. Puedes partir de una plantilla o del plan de otro
            cliente.
          </li>
        </Bullets>
        <Note>
          La copia siempre nace en <Term>Borrador</Term> y sin fechas: es un
          punto de partida, no un plan en marcha. Ponle las fechas y actívalo
          cuando lo tengas listo.
        </Note>
      </Section>

      <Section id="exportar" title="Entregar la rutina en papel">
        <P>
          En el plan abierto, <Btn icon={FileDown} variant="secondary">PDF</Btn> y{" "}
          <Btn icon={FileDown} variant="secondary">Word</Btn> generan el
          documento con la identidad de la marca, las imágenes de cada ejercicio
          y los datos del cliente. El cliente también puede descargárselo él
          mismo desde su portal.
        </P>
      </Section>

      <OpenScreen
        href="/routines"
        label="Abrir Rutinas"
        note="Tus plantillas reutilizables"
      />
    </>
  );
}
