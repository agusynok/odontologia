package dev.odontologia.disponibilidad;

import java.time.LocalDate;
import java.util.List;

import dev.odontologia.agenda.AgendaQueries;
import dev.odontologia.agenda.Turno;
import dev.odontologia.consultorio.ConsultorioQueries;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Disponibilidad;
import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Horario;
import dev.odontologia.disponibilidad.PublicAvailabilityService.DisponibilidadResult;
import dev.odontologia.gestion.CredencialesGestion;
import dev.odontologia.gestion.CredencialesGestion.TurnoAutorizado;
import org.springframework.stereotype.Service;

@Service
public final class GestionTurnoDisponibilidadService {

    private final CredencialesGestion credenciales;
    private final AgendaQueries agendaQueries;
    private final ConsultorioQueries consultorioQueries;
    private final PublicAvailabilityService disponibilidadC07;

    public GestionTurnoDisponibilidadService(CredencialesGestion credenciales, AgendaQueries agendaQueries,
                                             ConsultorioQueries consultorioQueries,
                                             PublicAvailabilityService disponibilidadC07) {
        this.credenciales = credenciales;
        this.agendaQueries = agendaQueries;
        this.consultorioQueries = consultorioQueries;
        this.disponibilidadC07 = disponibilidadC07;
    }

    public Disponibilidad consultar(String secreto, LocalDate desde, LocalDate hasta) {
        TurnoAutorizado autorizado = credenciales.validar(secreto)
                .orElseThrow(GestionTurnoException::linkNotAvailable);
        var config = consultorioQueries.findConfiguration()
                .orElseThrow(GestionTurnoException::technicalFailure);
        Turno turno = agendaQueries.findTurno(config.agenda().id(), autorizado.id())
                .filter(value -> value.estado() == Turno.Estado.CONFIRMADO)
                .orElseThrow(GestionTurnoException::linkNotAvailable);

        DisponibilidadResult resultado = disponibilidadC07.disponibilidad(turno.motivoId(), desde, hasta);
        List<Horario> horarios = resultado.slots().stream()
                .map(slot -> new Horario(slot.inicio(), slot.fin()))
                .toList();
        return new Disponibilidad(resultado.zonaHoraria().getId(), horarios);
    }
}
