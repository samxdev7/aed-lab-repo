package uni.AEDLab1.models;

import java.util.List;

public record NotacionPolacaRespuestaDto(
    String expresionOriginal,
    String expresionResultado,
    String modalidad,
    int totalPasos,
    List<PasoNotacionPolacaDto> pasos,
    List<FotogramaNotacionPolacaDto> fotogramas
) {}
