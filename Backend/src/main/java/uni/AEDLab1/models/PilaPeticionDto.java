package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PilaPeticionDto(
    @JsonAlias({"nombre", "centroComercial"})
    @NotBlank(message = "El nombre del centro comercial no puede estar vacío.")
    @Size(min = 1, max = 30, message = "El nombre no puede superar los 30 caracteres.")
    @Pattern(regexp = "^[\\p{L}\\d .'-]+$", message = "El nombre solo puede contener letras, números, espacios, punto, apóstrofo y guion.")
    String centroComercial
) {}