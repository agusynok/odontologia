package dev.odontologia.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
final class LocalFrontendController {

    @GetMapping({"/reservar", "/reservar/{*path}", "/gestionar-turno", "/gestionar-turno/{*path}"})
    String frontend() {
        return "forward:/index.html";
    }
}
