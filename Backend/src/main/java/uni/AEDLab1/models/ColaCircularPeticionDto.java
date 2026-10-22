package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ColaCircularPeticionDto(
    @JsonAlias({"trabajo", "estacionDeTrabajo", "documento", "job"})
    @NotBlank(message = "El trabajo de impresión no puede estar vacío.")
    @Size(min = 1, max = 15, message = "El trabajo de impresión debe contener entre 1 y 15 caracteres.")
    @Pattern(regexp = "^[A-Za-z0-9 _.-]+$", message = "El trabajo de impresión solo puede contener letras, números, espacios y guiones (- / _).")
    String estacion
) {}

