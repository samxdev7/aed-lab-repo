package uni.AEDLab1.models;

public record PilaEstadoDto(
    String[] elementos,        // Pila[0..Tope]: de la base (0) hasta el tope
    int tope,                  // Tope (-1 = pila vacía)
    int max,                   // Max: capacidad del arreglo
    String mensaje,
    String tipoMensaje,        // "ok" | "info" | "warn"
    String elementoAfectado    // Dato que entró (Push) o salió (Pop); null en las demás consultas
) {}