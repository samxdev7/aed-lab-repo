package uni.AEDLab1.models;

public record MovimientoRanaDto(
    int numeroMovimiento,
    int posicionOrigen,
    int posicionDestino,
    char tipoFicha,
    String estadoResultante
) {}