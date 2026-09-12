package uni.AEDLab1.services;

/**
 * Servicio que maneja la interacción de las piezas de reinas dentro del tablero de ajedrez,
 * procesadas dentro de un arreglo estático que simula a la estructura Set.
 * 
 * @author samxdev7
 * @version 1.0
 */
public class OchoReinasService {
    private final int TAMANO = 8;
    private final int X = 0;
    private final int Y = 1;
    
    private int[][] registroReinas;
    private int ultimo = -1;
    
    public OchoReinasService() {
        this.registroReinas = new int[TAMANO][2];
    }
    
    public int[][] getQueens() { return this.registroReinas; }
    
    /**
     * @param x -> Posicion de la reina a colocar en coordenada en x.
     * @param y -> Posicion de la reina a colocar en coordenada en y.
     * 
     * @return Señal de colocado de reina dentro del tablero exitoso.
     */
    public boolean agregarReina(int x, int y) {
        if (verificarPiezaExistente(ultimo, x, y)) return false;
        
        this.registroReinas[++ultimo][X] = x;
        this.registroReinas[ultimo][Y] = y;
        return true;
    }
    
    /**
     * @param currX -> Posicion actual de la reina a mover en coordenada en x.
     * @param currY -> Posicion actual de la reina a mover en coordenada en y.
     * @param newX -> Posicion objetivo de la reina a mover en coordenada en x.
     * @param newY -> Posicion objetivo de la reina a mover en coordenada en y.
     * 
     * @return Señal de colocado de reina dentro del tablero exitoso.
     */
    public boolean moverReina(int currX, int currY, int newX, int newY) {
        if (verificarPiezaExistente(ultimo, newX, newY)) return false;
        int pos = obtenerIndiceDeReinaEnRegistro(ultimo, currX, currY);
        
        this.registroReinas[pos][X] = newX;
        this.registroReinas[pos][Y] = newY;
        return true;
    }
    
    /**
     * @return Señal de registro limpiado correctamente.
     */
    public boolean reiniciarRegistroDeReinas() {
        ultimo = -1;
        registroReinas = new int[TAMANO][2];
        return true;
    }
    
    private boolean verificarPiezaExistente(int i, int x, int y) {
        if (i < 0) return false;
        if ((this.registroReinas[i][X] == x) && (this.registroReinas[i][Y] == y))
            return true;
        
        return verificarPiezaExistente(i-1, x, y);
    }
    
    private int obtenerIndiceDeReinaEnRegistro(int i, int x, int y) {
        if (i < 0) return -1;
        if ((this.registroReinas[i][X] == x) && (this.registroReinas[i][Y] == y)) {
            return i;
        }
        
        return obtenerIndiceDeReinaEnRegistro(i-1, x, y);
    }
    
    /**
     * @return Señal de las ocho reinas colocadas en posiciones en el que no se amenacen mutuamente.
     */
    public boolean ejecutarVerificacion() {
        int i = 0, j = 0;
        
        if (ultimo < TAMANO - 1) return false;
        return verificar(i, j);
    }
    
    private boolean verificar(int i, int j) {
        if ((i >= TAMANO - 1) && (j >= TAMANO - 1)) return true;
        if (i == j) return verificar(i, ++j);
        
        if (unaReinaAmenazaAOtraReina(registroReinas[i][X], registroReinas[i][Y], registroReinas[j][X], registroReinas[j][Y])) {
            return false;
        }
        
        if (j >= TAMANO - 1) return verificar(++i, (j = 0));
        return verificar(i, ++j);
    }
    
    private boolean unaReinaAmenazaAOtraReina(int x1, int y1, int x2, int y2) {
        return (x1 == x2) && (y1 == y2) && (Math.abs(x2 - x1) == Math.abs(y2 - y1));
    }
}
