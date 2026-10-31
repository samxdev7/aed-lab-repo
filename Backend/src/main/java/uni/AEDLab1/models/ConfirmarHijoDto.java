package uni.AEDLab1.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConfirmarHijoDto(
    @NotBlank(message = "El valor no puede estar vacío.")
    @Pattern(regexp = "^[A-Za-z]$", message = "Debe ser una letra de la A-Z.")
    String valor
) {}