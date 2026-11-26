package dev.odontologia.disponibilidad;

import java.time.LocalDate;

import dev.odontologia.disponibilidad.GestionTurnoDisponibilidadDtos.Disponibilidad;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gestion/turno")
public final class GestionTurnoDisponibilidadController {

    private final GestionTurnoDisponibilidadService service;

    public GestionTurnoDisponibilidadController(GestionTurnoDisponibilidadService service) {
        this.service = service;
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<Disponibilidad> consultar(
            @RequestHeader(name = GestionTurnoController.MANAGEMENT_TOKEN, required = false) String secreto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(service.consultar(secreto, desde, hasta));
    }
}
