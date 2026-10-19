package uni.AEDLab1.models;

import java.util.List;

public record FotogramaNotacionPolacaDto(
    String tipo,
    String operador,
    List<String> pila,
    PasoNotacionPolacaDto paso
) {}
