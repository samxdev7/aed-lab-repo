package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ColaPeticionDto(
    @JsonAlias({"nombre", "persona"})
    @NotBlank(message = "El nombre de la persona no puede estar vacío.")
    @Size(min = 1, max = 12, message = "El nombre no puede superar los 12 caracteres.")
    @Pattern(regexp = "^[\\p{L} ]+$", message = "El nombre solo puede contener letras y espacios.")
    String persona
) {}