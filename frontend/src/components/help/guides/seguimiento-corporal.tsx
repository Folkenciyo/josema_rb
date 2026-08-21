import { FileDown, Plus, Trash2 } from "lucide-react";

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
} from "../help-ui";

export function SeguimientoCorporal() {
  return (
    <>
      <P>
        Cuatro cosas cuentan la evolución de un cliente: el peso, las medidas,
        las fotos y lo que levanta. Las tres primeras viven en su ficha y son las
        que dan el documento de Seguimiento.
      </P>

      <OpenScreen
        href="/clients"
        label="Abrir Clientes"
        note="Peso, medidas y fotos están dentro de la ficha"
      />

      <Section id="peso" title="Peso e IMC">
        <P>
          La tarjeta <Term>Peso y seguimiento</Term> muestra el último pesaje, su
          variación desde el principio y una gráfica con todo el histórico.
        </P>
        <P>
          Puedes apuntar un pesaje tú con{" "}
          <Btn icon={Plus} variant="secondary">Añadir peso</Btn>,
          pero lo normal es que lo haga el cliente desde su portal. Solo hay{" "}
          <strong>un pesaje por día</strong>: si se repite el mismo día, el nuevo
          corrige al anterior.
        </P>
        <Note>
          El IMC <strong>no se guarda</strong>: se calcula al vuelo con la altura
          de la ficha. Por eso, si corriges la altura, todo el histórico de IMC
          queda bien de golpe. Sin altura, el IMC aparece vacío.
        </Note>
        <P>
          Las variaciones se muestran en color neutro a propósito: la aplicación
          no da por hecho que adelgazar sea el objetivo.
        </P>
      </Section>

      <Section id="medidas" title="Medidas corporales">
        <P>
          La báscula sola engaña: el peso se queda quieto mientras la cintura
          baja y el brazo sube. La tarjeta <Term>Medidas corporales</Term> lleva
          nueve zonas fijas —cuello, pecho, brazo derecho, brazo izquierdo,
          antebrazo, cintura, cadera, muslo y gemelo— y se rellenan solo las que
          midas.
        </P>
        <P>
          Las apuntáis los dos, igual que el peso: tú con{" "}
          <Btn icon={Plus} variant="secondary">Añadir medidas</Btn> y el cliente
          desde <strong>Mi cuerpo</strong> en su portal. Hay{" "}
          <strong>una toma por día</strong>, y volver a guardar el mismo día
          corrige la anterior.
        </P>
        <Bullets>
          <li>
            Arriba eliges una zona y ves su gráfica: cada zona lleva su propia
            evolución, y una zona que no mediste ese día no rompe la línea.
          </li>
          <li>
            Debajo, la tabla del histórico con todas las zonas medidas, una
            columna por zona.
          </li>
          <li>
            Cuando el cliente guarda una zona suelta, se suma a la toma de ese
            día en vez de borrar las demás.
          </li>
        </Bullets>
        <Note>
          Dile que mida siempre a la misma hora y sin apretar la cinta. Media
          hora después de comer, o con la cinta tirante, cambian más centímetros
          que una semana de entreno.
        </Note>
      </Section>

      <Section id="permiso" title="El permiso del cliente">
        <P>
          Las fotos son datos sensibles, así que{" "}
          <strong>manda el cliente</strong>. En su portal, en{" "}
          <strong>Ficha</strong> o en <strong>Mis fotos</strong>, tiene tres
          botones: autorizar que se guarden, retirar el permiso y borrarlas
          todas.
        </P>
        <Bullets>
          <li>
            <strong>Sin permiso</strong>, la galería de su portal ni se abre.
          </li>
          <li>
            <strong>Retirar el permiso</strong> no borra nada: solo cierra su
            galería y dice «de aquí en adelante, no».
          </li>
          <li>
            <strong>Borrar las fotos</strong> sí las elimina, con sus archivos, y
            no tiene vuelta atrás.
          </li>
        </Bullets>
        <Note kind="warn">
          Pídele el permiso antes de hacerle la primera foto. La tarjeta de su
          ficha te dice si lo ha dado y desde cuándo.
        </Note>
      </Section>

      <Section id="fotos" title="Subir y comparar fotos">
        <P>
          Las fotos <strong>las subes tú</strong>, desde{" "}
          <Term>Fotos de progreso</Term> en la ficha. El cliente nunca sube
          ninguna.
        </P>
        <Steps>
          <Step title="Elige la fecha">
            Por defecto es hoy. Todas las fotos de una revisión comparten fecha.
          </Step>
          <Step title="Sube las tres poses">
            <Term>Frontal</Term>, <Term>Lateral</Term> y <Term>Trasera</Term>. No
            hace falta tenerlas las tres.
          </Step>
          <Step title="Compara dos fechas">
            Con al menos dos revisiones aparece el comparador: eliges{" "}
            <Term>Antes</Term> y <Term>Después</Term> y las enfrenta pose con
            pose, con el peso de cada momento debajo.
          </Step>
        </Steps>
        <Note>
          Subir otra foto de la misma fecha y la misma pose{" "}
          <strong>sustituye</strong> a la anterior. Las fotos se reducen y se les
          quitan los metadatos al guardarlas, incluida la localización que traen
          los móviles.
        </Note>
      </Section>

      <Section id="documento" title="El documento de Seguimiento">
        <P>
          Desde el comparador, <Btn icon={FileDown} variant="secondary">PDF</Btn> o{" "}
          <Btn icon={FileDown} variant="secondary">Word</Btn> generan un
          documento con las dos fechas enfrentadas, foto a foto, el peso y el IMC
          de cada momento y una tabla con las medidas de las dos tomas y su
          diferencia. Es el tercer documento que entrega la aplicación, junto a
          la rutina y la dieta.
        </P>
        <Note>
          Si el pesaje o las medidas más cercanas a una foto no son exactamente
          del mismo día, el documento lo dice en vez de fingir que coinciden. Y
          las zonas que nunca mediste no salen en la tabla.
        </Note>
      </Section>

      <Section id="borrar" title="Borrar una foto suelta">
        <P>
          En la galería, cada foto tiene su{" "}
          <Btn icon={Trash2} variant="danger">papelera</Btn>. Es inmediato y no
          se puede deshacer.
        </P>
      </Section>
    </>
  );
}
