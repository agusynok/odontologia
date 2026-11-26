package dev.odontologia.disponibilidad;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import dev.odontologia.agenda.Agenda;
import dev.odontologia.agenda.AgendaQueries;
import dev.odontologia.agenda.Turno;
import dev.odontologia.consultorio.Consultorio;
import dev.odontologia.consultorio.ConsultorioQueries;
import dev.odontologia.consultorio.Odontologo;
import dev.odontologia.disponibilidad.AvailabilityRules.Slot;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Disponibilidad;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Horario;
import dev.odontologia.disponibilidad.PublicAvailabilityService.DisponibilidadResult;
import dev.odontologia.gestion.CredencialesGestion;
import dev.odontologia.gestion.CredencialesGestion.TurnoAutorizado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class GestionTurnoDisponibilidadServiceTest {

    private static final UUID AGENDA_ID = UUID.fromString("41000000-0000-0000-0000-000000000001");
    private static final UUID TURNO_ID = UUID.fromString("41000000-0000-0000-0000-000000000002");
    private static final UUID PACIENTE_ID = UUID.fromString("41000000-0000-0000-0000-000000000003");
    private static final UUID MOTIVO_ID = UUID.fromString("41000000-0000-0000-0000-000000000004");
    private static final UUID CREDENCIAL_ID = UUID.fromString("41000000-0000-0000-0000-000000000005");
    private static final String TOKEN = "abcdefghijklmnopabcdefghijklmnopabcdefghijklmnop";
    private static final LocalDate DESDE = LocalDate.of(2030, 1, 9);
    private static final LocalDate HASTA = LocalDate.of(2030, 1, 15);
    private static final Instant INICIO_TURNO = Instant.parse("2030-01-09T12:00:00Z");
    private static final Instant FIN_TURNO = Instant.parse("2030-01-09T12:30:00Z");
    private static final Instant INICIO_SLOT = Instant.parse("2030-01-09T09:00:00Z");
    private static final Instant FIN_SLOT = Instant.parse("2030-01-09T09:30:00Z");

    private final CredencialesGestion credenciales = mock(CredencialesGestion.class);
    private final AgendaQueries agendaQueries = mock(AgendaQueries.class);
    private final ConsultorioQueries consultorioQueries = mock(ConsultorioQueries.class);
    private final PublicAvailabilityService disponibilidadC07 = mock(PublicAvailabilityService.class);
    private GestionTurnoDisponibilidadService service;

    @BeforeEach
    void setUp() {
        service = new GestionTurnoDisponibilidadService(credenciales, agendaQueries, consultorioQueries,
                disponibilidadC07);
    }

    @Test
    void derivesMotifFromAuthorizedAppointmentAndReturnsOnlyZoneAndSlots() {
        var zone = ZoneId.of("America/Argentina/Buenos_Aires");
        var turn = new Turno(TURNO_ID, AGENDA_ID, PACIENTE_ID, MOTIVO_ID, INICIO_TURNO, FIN_TURNO,
                30, Turno.Estado.CONFIRMADO, 0, INICIO_TURNO.minusSeconds(86400), null);
        var authorized = new TurnoAutorizado(TURNO_ID, INICIO_TURNO, FIN_TURNO, 0, CREDENCIAL_ID,
                Optional.empty());
        var config = new ConsultorioQueries.Configuracion(
                new Consultorio(UUID.randomUUID(), "Prueba", zone),
                new Odontologo(UUID.randomUUID(), UUID.randomUUID(), "Profesional"),
                new Agenda(AGENDA_ID, UUID.randomUUID()));
        when(credenciales.validar(TOKEN)).thenReturn(Optional.of(authorized));
        when(consultorioQueries.findConfiguration()).thenReturn(Optional.of(config));
        when(agendaQueries.findTurno(AGENDA_ID, TURNO_ID)).thenReturn(Optional.of(turn));
        when(disponibilidadC07.disponibilidad(MOTIVO_ID, DESDE, HASTA)).thenReturn(
                new DisponibilidadResult(MOTIVO_ID, 30, zone, List.of(new Slot(INICIO_SLOT, FIN_SLOT))));

        Disponibilidad result = service.consultar(TOKEN, DESDE, HASTA);

        assertThat(result).isEqualTo(new Disponibilidad(zone.getId(), List.of(new Horario(INICIO_SLOT, FIN_SLOT))));
        verify(credenciales).validar(TOKEN);
        verify(agendaQueries).findTurno(AGENDA_ID, TURNO_ID);
        verify(disponibilidadC07).disponibilidad(MOTIVO_ID, DESDE, HASTA);
    }

    @Test
    void unavailableCredentialIsGenericAndStopsBeforeLookingUpAnAppointment() {
        when(credenciales.validar(TOKEN)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consultar(TOKEN, DESDE, HASTA))
                .isInstanceOf(GestionTurnoException.class)
                .hasMessage("LINK_NOT_AVAILABLE");

        verifyNoInteractions(agendaQueries, consultorioQueries, disponibilidadC07);
    }

    @Test
    void missingAuthorizedAppointmentIsAlsoReportedAsUnavailable() {
        when(credenciales.validar(TOKEN)).thenReturn(Optional.of(new TurnoAutorizado(TURNO_ID, INICIO_TURNO,
                FIN_TURNO, 0, CREDENCIAL_ID, Optional.empty())));
        when(consultorioQueries.findConfiguration()).thenReturn(Optional.of(new ConsultorioQueries.Configuracion(
                new Consultorio(UUID.randomUUID(), "Prueba", ZoneId.of("Etc/UTC")),
                new Odontologo(UUID.randomUUID(), UUID.randomUUID(), "Profesional"),
                new Agenda(AGENDA_ID, UUID.randomUUID()))));
        when(agendaQueries.findTurno(AGENDA_ID, TURNO_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consultar(TOKEN, DESDE, HASTA))
                .isInstanceOf(GestionTurnoException.class)
                .hasMessage("LINK_NOT_AVAILABLE");

        verifyNoInteractions(disponibilidadC07);
    }
}
