package dev.odontologia;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import dev.odontologia.agenda.AgendaQueries;
import dev.odontologia.agenda.AgendaWriteCoordinator;
import dev.odontologia.consultorio.ConsultorioQueries;
import dev.odontologia.disponibilidad.AvailabilityConfigurationService;
import dev.odontologia.disponibilidad.AvailabilityDtos.FranjaInput;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadController;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadService;
import dev.odontologia.disponibilidad.GestionTurnoErrorAdvice;
import dev.odontologia.disponibilidad.PublicAvailabilityService;
import dev.odontologia.gestion.CredencialesGestion;
import dev.odontologia.gestion.CredencialesGestion.TurnoAutorizado;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.support.JdbcTransactionManager;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GestionTurnoDisponibilidadIntegrationTest {

    private static final UUID TURNO_ID = UUID.fromString("42000000-0000-0000-0000-000000000001");
    private static final UUID CREDENCIAL_ID = UUID.fromString("42000000-0000-0000-0000-000000000002");
    private static final Instant AHORA = Instant.parse("2030-01-07T12:00:00Z");
    private static final Instant INICIO_TURNO = Instant.parse("2030-01-09T12:00:00Z");
    private static final Instant FIN_TURNO = Instant.parse("2030-01-09T12:30:00Z");
    private static final byte[] TOKEN_BYTES = new byte[32];
    private static final String TOKEN = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(TOKEN_BYTES);

    @Test
    void protectedAvailabilityUsesAuthorizedMotifAndLeavesPostgresUnchanged() throws Exception {
        try (var db = new TestDatabase()) {
            var fixture = CoreSchemaTest.fixture(db);
            CoreSchemaTest.insertTurn(db.jdbc, fixture, TURNO_ID, INICIO_TURNO.atOffset(ZoneOffset.UTC),
                    FIN_TURNO.atOffset(ZoneOffset.UTC), "CONFIRMADO");
            UUID otherMotif = UUID.randomUUID();
            db.jdbc.update("INSERT INTO motivo_consulta VALUES (?, ?, 'Otro motivo', 60)", otherMotif, fixture.agenda());

            var agendaQueries = new AgendaQueries(db.jdbc);
            var consultorioQueries = new ConsultorioQueries(db.jdbc);
            var coordinator = new AgendaWriteCoordinator(db.jdbc, new JdbcTransactionManager(db.dataSource()));
            new AvailabilityConfigurationService(db.jdbc, agendaQueries, consultorioQueries, coordinator)
                    .replaceHorario(List.of(new FranjaInput(UUID.randomUUID(), 3, LocalTime.of(9, 0),
                            LocalTime.of(17, 0), "ATENCION")));

            var credenciales = mock(CredencialesGestion.class);
            when(credenciales.validar(TOKEN)).thenReturn(Optional.of(new TurnoAutorizado(TURNO_ID,
                    INICIO_TURNO, FIN_TURNO, 0, CREDENCIAL_ID, Optional.empty())));
            var c07 = new PublicAvailabilityService(agendaQueries, consultorioQueries,
                    Clock.fixed(AHORA, ZoneOffset.UTC));
            var service = new GestionTurnoDisponibilidadService(credenciales, agendaQueries, consultorioQueries, c07);
            MockMvc mvc = MockMvcBuilders.standaloneSetup(new GestionTurnoDisponibilidadController(service))
                    .setControllerAdvice(new GestionTurnoErrorAdvice())
                    .build();

            var response = mvc.perform(get("/api/gestion/turno/disponibilidad")
                            .header("X-Management-Token", TOKEN)
                            .param("desde", "2030-01-09")
                            .param("hasta", "2030-01-09")
                            .param("motivoId", otherMotif.toString()))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Cache-Control", "no-store"))
                    .andReturn().getResponse().getContentAsString();

            assertThat(response).contains("\"zonaHoraria\":\"Etc/UTC\"")
                    .doesNotContain("\"motivoId\"", "\"duracionMinutos\"", "\"email\"");
            Matcher horarios = Pattern.compile("\"inicio\":\"([^\"]+)\",\"fin\":\"([^\"]+)\"")
                    .matcher(response);
            int cantidadHorarios = 0;
            while (horarios.find()) {
                Instant inicio = Instant.parse(horarios.group(1));
                Instant fin = Instant.parse(horarios.group(2));
                assertThat(fin).isEqualTo(inicio.plusSeconds(30 * 60));
                assertThat(inicio).isNotEqualTo(INICIO_TURNO);
                cantidadHorarios++;
            }
            assertThat(cantidadHorarios).isPositive();
            assertThat(db.jdbc.queryForObject("SELECT revision FROM turno WHERE id = ?", Integer.class, TURNO_ID))
                    .isZero();
            assertThat(db.jdbc.queryForObject("SELECT inicio FROM turno WHERE id = ?",
                    java.time.OffsetDateTime.class, TURNO_ID).toInstant()).isEqualTo(INICIO_TURNO);
            assertThat(db.jdbc.queryForObject("SELECT count(*) FROM intencion_notificacion WHERE turno_id = ?",
                    Long.class, TURNO_ID)).isZero();
        }
    }
}
