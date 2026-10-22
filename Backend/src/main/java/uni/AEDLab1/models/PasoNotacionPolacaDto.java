package uni.AEDLab1.models;

public record PasoNotacionPolacaDto(
    int numeroPaso,
    String operador,
    String subExpresion,
    String subExpresionConvertida,
    String expresionCompleta
) {}
