package dev.odontologia.disponibilidad;

import dev.odontologia.agenda.AgendaWriteException;
import org.springframework.dao.DataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(assignableTypes = {GestionTurnoController.class, GestionTurnoDisponibilidadController.class})
public final class GestionTurnoErrorAdvice {

    @ExceptionHandler(GestionTurnoException.class)
    public ResponseEntity<ErrorResponse> gestion(GestionTurnoException failure) {
        return response(failure.status(), failure.codigo().name());
    }

    @ExceptionHandler(AvailabilityException.class)
    public ResponseEntity<ErrorResponse> disponibilidad(AvailabilityException failure) {
        if (failure.status() == HttpStatus.BAD_REQUEST && "VALIDATION_ERROR".equals(failure.codigo())) {
            return response(failure.status(), failure.codigo());
        }
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "TECHNICAL_FAILURE");
    }

    @ExceptionHandler(AgendaWriteException.class)
    public ResponseEntity<ErrorResponse> agenda(AgendaWriteException failure) {
        if (failure.reason() == AgendaWriteException.Reason.LOCK_TIMEOUT) {
            return response(HttpStatus.CONFLICT, "AGENDA_BUSY");
        }
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "TECHNICAL_FAILURE");
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentNotValidException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> solicitudInvalida(Exception failure) {
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> persistencia(DataAccessException failure) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "TECHNICAL_FAILURE");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> inesperado(Exception failure) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "TECHNICAL_FAILURE");
    }

    private static ResponseEntity<ErrorResponse> response(HttpStatus status, String code) {
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore())
                .body(new ErrorResponse(code));
    }

    public record ErrorResponse(String codigo) {
    }
}
