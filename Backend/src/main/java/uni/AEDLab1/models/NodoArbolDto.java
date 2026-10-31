package uni.AEDLab1.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record NotacionPolacaPeticionDto(
    @NotBlank(message = "Ingrese una expresión algebraica infija.")
    String expresion,

    @NotBlank(message = "Debe especificar la modalidad de conversión ('prefijo' o 'postfijo').")
    @Pattern(regexp = "(?i)^(prefijo|prefija|postfijo|postfija)$", message = "La modalidad debe ser 'prefijo' o 'postfijo'.")
    String modalidad
) {}

