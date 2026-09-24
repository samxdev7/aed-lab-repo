package uni.AEDLab1.models;

import java.util.List;

public record SaltoRanaRespuestaDto(
    String estadoInicial,
    String estadoFinal,
    int totalMovimientos,
    List<MovimientoRanaDto> movimientos
) {}