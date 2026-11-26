package dev.odontologia.disponibilidad;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Disponibilidad;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Horario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GestionTurnoDisponibilidadControllerTest {

    private static final String TOKEN = "abcdefghijklmnopabcdefghijklmnopabcdefghijklmnop";
    private static final String URL = "/api/gestion/turno/disponibilidad";
    private static final LocalDate DIA = LocalDate.of(2030, 1, 9);
    private static final Instant INICIO = Instant.parse("2030-01-09T09:00:00Z");
    private static final Instant FIN = Instant.parse("2030-01-09T09:30:00Z");

    private GestionTurnoDisponibilidadService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(GestionTurnoDisponibilidadService.class);
        mvc = MockMvcBuilders.standaloneSetup(new GestionTurnoDisponibilidadController(service))
                .setControllerAdvice(new GestionTurnoErrorAdvice())
                .build();
    }

    @Test
    void getReturnsOnlyAuthorizedAvailabilityWithoutCachingOrClientSelectedMotif() throws Exception {
        when(service.consultar(TOKEN, DIA, DIA)).thenReturn(new Disponibilidad("Etc/UTC",
                List.of(new Horario(INICIO, FIN))));

        mvc.perform(get(URL)
                        .header("X-Management-Token", TOKEN)
                        .param("desde", DIA.toString())
                        .param("hasta", DIA.toString())
                        .param("motivoId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.zonaHoraria").value("Etc/UTC"))
                .andExpect(jsonPath("$.horarios[0].inicio").value(INICIO.toString()))
                .andExpect(jsonPath("$.horarios[0].fin").value(FIN.toString()))
                .andExpect(jsonPath("$.motivoId").doesNotExist())
                .andExpect(jsonPath("$.duracionMinutos").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.turnoId").doesNotExist());

        verify(service).consultar(TOKEN, DIA, DIA);
    }

    @Test
    void unavailableCredentialReturnsGenericNotFoundWithoutCaching() throws Exception {
        doThrow(GestionTurnoException.linkNotAvailable()).when(service).consultar(null, null, null);

        mvc.perform(get(URL))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.codigo").value("LINK_NOT_AVAILABLE"))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.motivoId").doesNotExist());
    }

    @Test
    void malformedDateReturnsGenericValidationError() throws Exception {
        mvc.perform(get(URL).header("X-Management-Token", TOKEN).param("desde", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.codigo").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").doesNotExist());
    }
}
