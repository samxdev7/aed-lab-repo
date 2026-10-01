package uni.AEDLab1.models;

public record SaltoRanaRespuestaDto(
    String estadoInicial,
    String estadoFinal,
    int totalMovimientos,
    MovimientoRanaDto[] movimientos
) {}