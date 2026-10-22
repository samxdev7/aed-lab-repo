package uni.AEDLab1.models;

public record FotogramaNotacionPolacaDto(
    String tipo,
    String operador,
    String[] pila,
    PasoNotacionPolacaDto paso
) {}

