import { Link2, Mail, MessageCircle, RefreshCw, Trash2 } from "lucide-react";

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

export function PortalDelCliente() {
  return (
    <>
      <P>
        Cada cliente tiene una dirección propia y secreta. Entra desde el móvil,{" "}
        <strong>sin usuario y sin contraseña</strong>, y ve lo suyo: su rutina,
        su dieta, su peso, sus fotos y su progreso. Esa dirección la generas tú
        desde su ficha.
      </P>

      <OpenScreen
        href="/clients"
        label="Abrir Clientes"
        note="El enlace se genera dentro de la ficha de cada uno"
      />

      <Section id="generar" title="Generar y enviar el enlace">
        <Steps>
          <Step title="Entra en la ficha del cliente">
            Busca la tarjeta <Term>Acceso del cliente</Term>, en la columna
            izquierda.
          </Step>
          <Step title="Genera el enlace">
            Con <Btn icon={Link2}>Generar enlace</Btn>. Aparece la dirección
            completa y la fecha en que la creaste.
          </Step>
          <Step title="Mándaselo">
            <Btn icon={MessageCircle} variant="secondary">WhatsApp</Btn> abre la
            conversación con el mensaje ya escrito, y{" "}
            <Btn icon={Mail} variant="secondary">Email</Btn> hace lo mismo con el
            correo. También tienes <Btn variant="secondary">Copiar mensaje</Btn>{" "}
            y <Btn>Copiar enlace</Btn> para pegarlo donde quieras.
          </Step>
        </Steps>
        <P>
          El texto de esos mensajes lo eliges tú en{" "}
          <Where href="/settings">Ajustes</Where>; si no lo tocas, se usa uno de
          fábrica.
        </P>
      </Section>

      <Section id="que-ve" title="Qué ve el cliente">
        <P>Su portal tiene una barra inferior con seis apartados:</P>
        <Bullets>
          <li>
            <strong>Inicio</strong> — su nombre, su objetivo, el mensaje
            motivador del día y los accesos al resto.
          </li>
          <li>
            <strong>Entreno</strong> — el modo guiado: elige el día de su rutina
            y va apuntando los kilos y las repeticiones de cada serie.
          </li>
          <li>
            <strong>Rutina</strong> — su plan completo con las imágenes de cada
            ejercicio, semana a semana, y la descarga en PDF o Word.
          </li>
          <li>
            <strong>Dieta</strong> — sus menús por día, con las calorías y los
            macros, también descargables.
          </li>
          <li>
            <strong>Peso</strong> — apunta el peso de hoy y ve su gráfica y su
            historial.
          </li>
          <li>
            <strong>Ficha</strong> — el cuestionario inicial y el permiso para
            guardar sus fotos.
          </li>
        </Bullets>
        <P>
          Y en la portada aparecen además, cuando hay algo que enseñar,{" "}
          <strong>Mis fotos</strong> (si ha dado permiso y tiene fotos) y{" "}
          <strong>Mi progreso</strong> (si ha registrado alguna sesión).
        </P>
        <Note>
          La rutina y la dieta que ve son las que están en estado{" "}
          <Term>Activo</Term>. Mientras trabajas un plan en{" "}
          <Term>Borrador</Term>, el cliente no lo ve.
        </Note>
      </Section>

      <Section id="que-escribe" title="Qué puede escribir">
        <P>Tres cosas, y ninguna más:</P>
        <Bullets>
          <li>
            <strong>Su peso de hoy.</strong> La fecha la pone el servidor, así
            que no puede inventarse pesajes de otros días. Si se equivoca y lo
            vuelve a apuntar el mismo día, corrige el anterior en vez de crear
            uno nuevo.
          </li>
          <li>
            <strong>Las series que entrena.</strong> Peso y repeticiones de cada
            una, desde el modo guiado.
          </li>
          <li>
            <strong>El cuestionario inicial</strong>, y el permiso sobre sus
            fotos.
          </li>
        </Bullets>
        <Note>
          Las <strong>fotos las subes tú</strong>, nunca él. Él decide si se
          guardan y puede pedir que se borren todas, pero no puede añadir
          ninguna.
        </Note>
      </Section>

      <Section id="sin-cobertura" title="Sin cobertura">
        <P>
          El portal se puede instalar en el móvil como una aplicación: el propio
          portal se lo ofrece. Una vez instalado, lo que ya haya abierto — su
          rutina, su dieta — se sigue viendo aunque el gimnasio no tenga
          cobertura.
        </P>
        <P>
          Y si entrena sin línea, la sesión <strong>no se pierde</strong>: se
          queda guardada en su móvil y se envía sola en cuanto vuelve a haber
          red. Reenviarla dos veces no la duplica.
        </P>
      </Section>

      <Section id="anular" title="Anular o renovar el acceso">
        <P>
          Si el enlace se filtra o el cliente lo deja, tienes dos salidas en la
          misma tarjeta:
        </P>
        <Bullets>
          <li>
            <Btn icon={RefreshCw} variant="secondary">Regenerar</Btn> — crea uno
            nuevo y <strong>el anterior deja de funcionar</strong> en el acto.
            Tendrás que reenviarle el nuevo.
          </li>
          <li>
            <Btn icon={Trash2} variant="danger">Anular</Btn> — se queda sin
            acceso hasta que le generes otro.
          </li>
        </Bullets>
        <Note kind="warn">
          Dar de baja al cliente también cierra su portal, aunque conserve el
          enlace. Al reactivarlo, el mismo enlace vuelve a valer.
        </Note>
      </Section>
    </>
  );
}
