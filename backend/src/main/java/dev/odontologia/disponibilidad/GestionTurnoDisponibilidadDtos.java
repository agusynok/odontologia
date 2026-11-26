package dev.odontologia.disponibilidad;

import java.time.Instant;
import java.util.List;

public final class GestionTurnoDisponibilidadDtos {

    private GestionTurnoDisponibilidadDtos() {
    }

    public record Horario(Instant inicio, Instant fin) {
    }

    public record Disponibilidad(String zonaHoraria, List<Horario> horarios) {
    }
}
