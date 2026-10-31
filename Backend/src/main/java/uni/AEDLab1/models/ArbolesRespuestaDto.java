package uni.AEDLab1.models;

public record NotacionPolacaRespuestaDto(
    String expresionOriginal,
    String expresionResultado,
    String modalidad,
    int totalPasos,
    PasoNotacionPolacaDto[] pasos,
    FotogramaNotacionPolacaDto[] fotogramas
) {}

