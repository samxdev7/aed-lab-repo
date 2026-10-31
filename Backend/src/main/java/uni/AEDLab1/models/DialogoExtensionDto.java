package uni.AEDLab1.models;

public record DialogoExtensionDto(
    String fase,       // "pregunta" | "ingreso"
    String valorPadre,  // Letra del nodo padre
    String lado         // "izq" | "der"
) {}
